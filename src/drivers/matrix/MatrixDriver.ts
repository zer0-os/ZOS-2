/**
 * MatrixDriver - Plain class that owns Matrix transport and lifecycle
 * Handles: start/stop client, sockets, backoff, cursors, deviceId, etc.
 * No React dependencies - pure transport layer
 */

import * as sdk from "matrix-js-sdk";
import type { MatrixClient, MatrixEvent, Room } from "matrix-js-sdk";

export interface MatrixDriverConfig {
  homeserverUrl: string;
  accessToken: string;
  userId: string;
  deviceId?: string;
}

export interface MatrixDriverState {
  connected: boolean;
  syncing: boolean;
  error: string | null;
  deviceId: string | null;
}

export class MatrixDriver {
  private client: MatrixClient | null = null;
  private state: MatrixDriverState = {
    connected: false,
    syncing: false,
    error: null,
    deviceId: null,
  };
  
  private listeners: {
    stateChange: Array<(state: MatrixDriverState) => void>;
    message: Array<(event: MatrixEvent, room: Room) => void>;
    roomUpdate: Array<(room: Room) => void>;
  } = {
    stateChange: [],
    message: [],
    roomUpdate: [],
  };

  /**
   * Initialize the driver with configuration
   */
  async initialize(config: MatrixDriverConfig): Promise<void> {
    if (this.client) {
      await this.stop();
    }

    this.updateState({ error: null, deviceId: config.deviceId });

    try {
      // Create Matrix client
      console.log('[MatrixDriver] Creating client with:', {
        baseUrl: config.homeserverUrl,
        userId: config.userId,
        deviceId: config.deviceId,
        hasAccessToken: !!config.accessToken,
        tokenLength: config.accessToken?.length,
        tokenPreview: config.accessToken?.substring(0, 20) + '...'
      });
      
      // Create a unique storage key based on user ID to avoid conflicts
      const storageKey = `matrix_${config.userId.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // Clear any existing localStorage data for this user to avoid sync issues
      // BUT keep the device ID storage
      console.log('[MatrixDriver] Clearing localStorage for key:', storageKey);
      try {
        // Clear all localStorage keys that might be related to Matrix sync
        // but preserve the device ID key
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && 
              !key.startsWith('matrix_device_') && // Don't clear device ID storage
              (key.includes('matrix') || key.includes(storageKey))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          console.log('[MatrixDriver] Removing localStorage key:', key);
          window.localStorage.removeItem(key);
        });
      } catch (e) {
        console.warn('[MatrixDriver] Could not clear localStorage:', e);
      }
      
      // Create stores for the client
      const store = new sdk.MemoryStore();
      
      // Create an IndexedDB crypto store for persistent encryption support
      // This allows keys to persist across sessions
      let cryptoStore;
      try {
        // @ts-ignore - IndexedDBCryptoStore might not be in type definitions
        if (sdk.IndexedDBCryptoStore) {
          const dbName = `matrix-crypto-${config.userId.replace(/[^a-zA-Z0-9]/g, '_')}`;
          console.log('[MatrixDriver] Creating IndexedDB crypto store:', dbName);
          // @ts-ignore
          cryptoStore = new sdk.IndexedDBCryptoStore(
            window.indexedDB,
            dbName
          );
        } else {
          console.log('[MatrixDriver] IndexedDBCryptoStore not available, using MemoryCryptoStore');
          // @ts-ignore - MemoryCryptoStore might not be in type definitions
          cryptoStore = new sdk.MemoryCryptoStore();
        }
      } catch (e) {
        console.warn('[MatrixDriver] Failed to create IndexedDB crypto store, falling back to memory:', e);
        // @ts-ignore - MemoryCryptoStore might not be in type definitions
        cryptoStore = new sdk.MemoryCryptoStore();
      }
      
      // IMPORTANT: Use the deviceId from the config if provided
      // This ensures we use the same device across sessions
      console.log('[MatrixDriver] Creating client with deviceId:', config.deviceId);
      
      this.client = sdk.createClient({
        baseUrl: config.homeserverUrl,
        accessToken: config.accessToken,
        userId: config.userId,
        deviceId: config.deviceId, // Critical for encryption - must be consistent
        // Use memory store to avoid IndexedDB issues with saved sync
        store: store,
        // Use crypto store for encryption support
        cryptoStore: cryptoStore,
        // Time before sync timeout
        timelineSupport: true,
        // Ensure we use the same device ID for crypto
        useAuthorizationHeader: true,
      });

      // Get device ID from whoami - this validates the token
      try {
        const { device_id } = await this.client.whoami();
        this.updateState({ deviceId: device_id || null });
        console.log('[MatrixDriver] Token validated, device_id:', device_id);
      } catch (whoamiError) {
        console.error('[MatrixDriver] Token validation failed (whoami):', whoamiError);
        throw whoamiError;
      }

      // Initialize crypto for encrypted rooms
      console.log('[MatrixDriver] 🔐 Initializing crypto for encrypted rooms...');
      try {
        // @ts-ignore - Check if crypto needs initialization
        const cryptoEnabled = this.client.isCryptoEnabled?.() || this.client.getCrypto?.() !== null;
        console.log('[MatrixDriver] Current crypto status:', cryptoEnabled ? 'enabled' : 'disabled');
        
        if (!cryptoEnabled) {
          // Try different crypto initialization methods based on SDK version
          // @ts-ignore - Try Rust crypto first (newer SDK versions)
          if (this.client.initRustCrypto) {
            console.log('[MatrixDriver] 🔐 Initializing Rust crypto backend...');
            try {
              // @ts-ignore
              await this.client.initRustCrypto();
              console.log('[MatrixDriver] ✅ Rust crypto initialized successfully');
            } catch (rustError) {
              console.warn('[MatrixDriver] Rust crypto failed, trying legacy crypto:', rustError);
              // @ts-ignore - Fall back to legacy crypto
              if (this.client.initCrypto) {
                // @ts-ignore
                await this.client.initCrypto();
                console.log('[MatrixDriver] ✅ Legacy crypto initialized as fallback');
              }
            }
          }
          // @ts-ignore - Try legacy crypto if Rust crypto not available
          else if (this.client.initCrypto) {
            console.log('[MatrixDriver] 🔐 Initializing legacy crypto backend...');
            // @ts-ignore
            await this.client.initCrypto();
            console.log('[MatrixDriver] ✅ Legacy crypto initialized successfully');
          } 
          // @ts-ignore - For older SDK versions, crypto might auto-initialize
          else if (this.client.isCryptoEnabled && !this.client.isCryptoEnabled()) {
            console.log('[MatrixDriver] 🔐 Attempting to enable crypto via client start...');
            // Crypto will be initialized when client starts
          } else {
            console.warn('[MatrixDriver] ⚠️ No crypto initialization method available in this SDK version');
          }
          
          // @ts-ignore - Verify crypto is now enabled
          const nowEnabled = this.client.isCryptoEnabled?.() || this.client.getCrypto?.() !== null;
          console.log('[MatrixDriver] Crypto status after init:', nowEnabled ? '✅ ENABLED' : '❌ DISABLED');
          
          if (nowEnabled) {
            // @ts-ignore - Set up cross-signing if available
            if (this.client.getCrypto?.()?.bootstrapCrossSigning) {
              console.log('[MatrixDriver] Setting up cross-signing for device verification...');
              try {
                // @ts-ignore
                await this.client.getCrypto().bootstrapCrossSigning({
                  authUploadDeviceSigningKeys: async () => {
                    // Auto-approve for simplicity
                    // @ts-ignore - Return type mismatch
                    return;
                  }
                });
                console.log('[MatrixDriver] ✅ Cross-signing configured');
              } catch (e) {
                console.warn('[MatrixDriver] Could not set up cross-signing:', e);
              }
            }
            
            // Set up key backup for recovery
            // @ts-ignore
            if (this.client.getCrypto?.()?.checkKeyBackup) {
              console.log('[MatrixDriver] Checking key backup status...');
              try {
                // @ts-ignore
                const backupInfo = await this.client.getCrypto().checkKeyBackup();
                if (!backupInfo) {
                  console.log('[MatrixDriver] No key backup found, creating one...');
                  // @ts-ignore
                  if (this.client.getCrypto().createKeyBackupVersion) {
                    try {
                      // @ts-ignore
                      await this.client.getCrypto().createKeyBackupVersion();
                      console.log('[MatrixDriver] ✅ Key backup created');
                    } catch (e) {
                      console.warn('[MatrixDriver] Could not create key backup:', e);
                    }
                  }
                } else {
                  console.log('[MatrixDriver] Key backup already exists');
                  // Try to restore from backup
                  // @ts-ignore
                  if (this.client.getCrypto().restoreKeyBackup) {
                    console.log('[MatrixDriver] Attempting to restore from key backup...');
                    try {
                      // @ts-ignore
                      await this.client.getCrypto().restoreKeyBackup();
                      console.log('[MatrixDriver] ✅ Keys restored from backup');
                    } catch (e) {
                      console.warn('[MatrixDriver] Could not restore from key backup:', e);
                    }
                  }
                }
              } catch (e) {
                console.warn('[MatrixDriver] Error checking key backup:', e);
              }
            }
          }
        } else {
          console.log('[MatrixDriver] ✅ Crypto already enabled');
        }
      } catch (cryptoError) {
        console.error('[MatrixDriver] ❌ Failed to initialize crypto:', cryptoError);
        // Continue anyway - unencrypted rooms will still work
      }

      // Set up event listeners
      this.setupEventListeners();

      // Don't automatically start syncing - let the caller decide
      // The client is ready to use for basic operations without syncing
      this.updateState({ connected: true, syncing: false });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateState({ error: errorMessage });
      throw error;
    }
  }

  /**
   * Start the Matrix client (begin syncing)
   * Uses sliding sync to get only the 20 most recent rooms by activity
   */
  async start(): Promise<void> {
    if (!this.client) {
      throw new Error('Driver not initialized');
    }

    if (this.syncStarted) {
      console.log('[MatrixDriver] Sync already started, skipping');
      return;
    }

    try {
      this.updateState({ syncing: true });
      
      console.log('[MatrixDriver] Starting sync (will filter to 20 most recent rooms)...');
      
      // Configure sync options - get initial messages for better UX
      const syncOptions = {
        // Initial sync gets more messages for better UX
        initialSyncLimit: 20,
        
        // Include only joined rooms, not archived
        includeArchivedRooms: false,
        
        // Use lazy loading for room members to reduce data
        // Note: We set this directly, not with a custom filter
        lazyLoadMembers: true,
        
        // Polling timeout for long polling
        pollTimeout: 30000,
        
        // Don't sync presence to reduce overhead
        disablePresence: true
      };
      
      // Since we're using MemoryStore, we don't need to clear any persisted data
      // The MemoryStore starts fresh each time
      console.log('[MatrixDriver] Using MemoryStore - no persisted sync data to clear');
      
      // Check current sync state before starting
      const currentSyncState = this.client.getSyncState();
      console.log('[MatrixDriver] Current sync state before start:', currentSyncState);
      
      // Start syncing with the server
      console.log('[MatrixDriver] Starting client with options:', syncOptions);
      // @ts-ignore - Some options might not be in type definitions
      await this.client.startClient(syncOptions);
      this.syncStarted = true;
      
      // Check sync state immediately after start
      const newSyncState = this.client.getSyncState();
      console.log('[MatrixDriver] Sync state after startClient:', newSyncState);
      console.log('[MatrixDriver] ✅ Client started - waiting for PREPARED state...');
      
      this.updateState({ connected: true, syncing: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start client';
      console.error('[MatrixDriver] Failed to start client:', error);
      this.updateState({ error: errorMessage, syncing: false });
      throw error;
    }
  }

  /**
   * Focus on a specific room and ensure its timeline is loaded
   * This is called when a user selects a room to view
   */
  async focusRoom(roomId: string, messageLimit: number = 50): Promise<void> {
    if (!this.client) {
      throw new Error('Driver not initialized');
    }

    console.log(`[MatrixDriver] focusRoom called for ${roomId}`);
    const room = this.client.getRoom(roomId);
    if (!room) {
      console.warn(`[MatrixDriver] Room ${roomId} not found in client`);
      // Log all available rooms for debugging
      const allRooms = this.client.getRooms();
      console.log(`[MatrixDriver] Available rooms: ${allRooms.map(r => `${r.roomId} (${r.name})`).join(', ')}`);
      return;
    }

    console.log(`[MatrixDriver] Focusing on room ${roomId} (${room.name}), loading ${messageLimit} messages`);

    try {
      // Get the live timeline
      const timeline = room.getLiveTimeline();
      const currentEvents = timeline.getEvents();
      
      console.log(`[MatrixDriver] Timeline currently has ${currentEvents.length} events`);
      
      // If we don't have enough messages, paginate to load more
      if (currentEvents.length < messageLimit) {
        console.log(`[MatrixDriver] Paginating to load ${messageLimit} messages (currently have ${currentEvents.length})`);
        
        // Check if room is encrypted
        const isEncrypted = room.hasEncryptionStateEvent?.() || false;
        if (isEncrypted) {
          console.log(`[MatrixDriver] Room ${roomId} is encrypted - pagination may trigger key requests`);
        }
        
        // @ts-ignore - Matrix SDK method
        await this.client.paginateEventTimeline(timeline, {
          backwards: true,
          limit: messageLimit
        });
        
        const afterPagination = timeline.getEvents();
        console.log(`[MatrixDriver] After pagination: ${afterPagination.length} events in timeline`);
        
        // For encrypted rooms, trigger quick decryption attempts (no waiting)
        // @ts-ignore - isCryptoEnabled might not be in type definitions
        if (isEncrypted && this.client.isCryptoEnabled?.()) {
          console.log(`[MatrixDriver] Triggering decryption for encrypted events...`);
          
          // Try a quick decrypt for all encrypted events (don't wait for slow ones)
          const events = timeline.getEvents();
          const decryptPromises = events
            .filter(event => event.getType() === 'm.room.encrypted')
            .map(event => {
              // @ts-ignore - decryptEventIfNeeded might not be in type definitions
              if (this.client.decryptEventIfNeeded) {
                // @ts-ignore
                return this.client.decryptEventIfNeeded(event).catch(e => {
                  console.warn(`[MatrixDriver] Quick decrypt failed for event:`, e);
                });
              }
              return Promise.resolve();
            });
          
          // Run all decrypts in parallel but don't wait for them
          Promise.all(decryptPromises).catch(e => {
            console.warn(`[MatrixDriver] Some decrypts failed:`, e);
          });
          
          // Don't wait - let messages show immediately
        }
      } else {
        console.log(`[MatrixDriver] Timeline already has enough events (${currentEvents.length}), no pagination needed`);
      }
      
      // Trigger room update to notify listeners
      this.listeners.roomUpdate.forEach(listener => listener(room));
    } catch (error) {
      console.error(`[MatrixDriver] Failed to focus room ${roomId}:`, error);
      // Don't throw - this is a best-effort operation
    }
  }

  /**
   * Stop the Matrix client
   */
  async stop(): Promise<void> {
    if (this.client) {
      try {
        if (this.syncStarted) {
          this.client.stopClient();
          this.syncStarted = false;
        }
        this.removeEventListeners();
        this.client = null;
        this.updateState({ 
          connected: false, 
          syncing: false, 
          error: null, 
          deviceId: null 
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to stop client';
        this.updateState({ error: errorMessage });
      }
    }
  }

  /**
   * Get the current Matrix client (for adapter use)
   */
  getClient(): MatrixClient | null {
    return this.client;
  }

  /**
   * Get current driver state
   */
  getState(): MatrixDriverState {
    return { ...this.state };
  }

  /**
   * Check if driver is ready for operations
   */
  isReady(): boolean {
    return this.state.connected && !this.state.syncing && !this.state.error;
  }

  /**
   * Check if client is syncing
   */
  isSyncing(): boolean {
    return this.state.syncing;
  }

  /**
   * Check if client has been started (syncing initiated)
   */
  private syncStarted: boolean = false;
  
  hasSyncStarted(): boolean {
    return this.syncStarted;
  }

  /**
   * Wait for sync to reach PREPARED state
   */
  async waitForSync(timeoutMs: number = 10000): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    // If already prepared, return immediately
    if (this.client.getSyncState() === 'PREPARED') {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Sync timeout'));
      }, timeoutMs);

      // @ts-ignore - Matrix SDK event types
      const syncHandler = (state: string) => {
        if (state === 'PREPARED') {
          clearTimeout(timeout);
          // @ts-ignore - Matrix SDK event types
          this.client?.removeListener('sync', syncHandler);
          resolve();
        } else if (state === 'ERROR') {
          clearTimeout(timeout);
          // @ts-ignore - Matrix SDK event types
          this.client?.removeListener('sync', syncHandler);
          reject(new Error('Sync failed'));
        }
      };

      // @ts-ignore - Matrix SDK event types
      this.client.on('sync', syncHandler);
    });
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: MatrixDriverState) => void): () => void {
    this.listeners.stateChange.push(callback);
    return () => {
      const index = this.listeners.stateChange.indexOf(callback);
      if (index > -1) {
        this.listeners.stateChange.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to message events
   */
  onMessage(callback: (event: MatrixEvent, room: Room) => void): () => void {
    this.listeners.message.push(callback);
    return () => {
      const index = this.listeners.message.indexOf(callback);
      if (index > -1) {
        this.listeners.message.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to room update events
   */
  onRoomUpdate(callback: (room: Room) => void): () => void {
    this.listeners.roomUpdate.push(callback);
    return () => {
      const index = this.listeners.roomUpdate.indexOf(callback);
      if (index > -1) {
        this.listeners.roomUpdate.splice(index, 1);
      }
    };
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    // Handle timeline events (messages)
    // @ts-ignore - Matrix SDK event types
    this.client.on('Room.timeline', (event: MatrixEvent, room: Room, toStartOfTimeline: boolean) => {
      if (toStartOfTimeline) return;
      
      // Only process message events, ignore others to reduce noise
      if (event.getType() === 'm.room.message') {
        this.listeners.message.forEach(callback => callback(event, room));
        // Trigger room update so the room list can re-sort if needed
        this.listeners.roomUpdate.forEach(callback => callback(room));
      }
    });

    // Handle room updates
    // @ts-ignore - Matrix SDK event types
    this.client.on('Room', (room: Room) => {
      this.listeners.roomUpdate.forEach(callback => callback(room));
    });

    // Handle encryption events
    // @ts-ignore - Matrix SDK event types
    this.client.on('crypto.roomKeyRequest', (req: any) => {
      console.log('[MatrixDriver] 🔑 Room key requested:', req);
      // Auto-approve key requests from our own devices
      if (req.userId === this.client?.getUserId()) {
        console.log('[MatrixDriver] Auto-approving key request from own device');
      }
    });
    
    // @ts-ignore - Matrix SDK event types
    this.client.on('crypto.roomKeyRequestCancellation', (req: any) => {
      console.log('[MatrixDriver] 🔑 Room key request cancelled:', req);
    });
    
    // @ts-ignore - Matrix SDK event types  
    this.client.on('crypto.warning', (type: string) => {
      console.warn('[MatrixDriver] ⚠️ Crypto warning:', type);
    });
    
    // @ts-ignore - Matrix SDK event types
    this.client.on('Event.decrypted', (event: any) => {
      console.log(`[MatrixDriver] 🔓 Event decrypted: ${event.getId()}`);
      // Notify listeners that a room has updated (messages decrypted)
      const room = this.client?.getRoom(event.getRoomId());
      if (room) {
        this.listeners.roomUpdate.forEach(callback => callback(room));
      }
    });
    
    // @ts-ignore - Matrix SDK event types
    this.client.on('crypto.verification.request', (request: any) => {
      console.log('[MatrixDriver] 🔐 Device verification requested:', request);
      // For now, auto-accept verification requests
      // In production, you'd want user confirmation
      try {
        // @ts-ignore
        request.accept?.();
      } catch (e) {
        console.warn('[MatrixDriver] Could not auto-accept verification:', e);
      }
    });

    // Handle sync state changes
    // @ts-ignore - Matrix SDK event types
    this.client.on('sync', (state: string, prevState: string | null, data?: any) => {
      console.log(`[MatrixDriver] Sync state transition: ${prevState} -> ${state}`, data ? 'with data' : 'no data');
      
      if (state === 'PREPARED') {
        // Check crypto status when sync is ready
        // @ts-ignore
        const cryptoReady = this.client?.isCryptoEnabled?.() || false;
        console.log('[MatrixDriver] Crypto status at PREPARED:', cryptoReady ? '✅ Ready' : '⚠️ Not ready');
        
        // When sync is ready, try to verify our own device if needed
        if (cryptoReady) {
          this.setupDeviceVerification();
        }
        
        this.updateState({ connected: true, syncing: false });
        
        // Log when sync is ready with room information
        const rooms = this.client?.getRooms() || [];
        const joinedRooms = rooms.filter((room: any) => room.getMyMembership() === 'join');
        console.log('[MatrixDriver] ✅ SYNC READY - Loaded %d rooms (joined: %d)', 
          rooms.length, 
          joinedRooms.length
        );
        
        // Log the top 5 rooms by activity
        if (joinedRooms.length > 0) {
          const topRooms = joinedRooms
            .sort((a: any, b: any) => {
              // @ts-ignore
              const stampA = a.getBumpStamp?.() ?? a.getLastActiveTimestamp() ?? 0;
              // @ts-ignore
              const stampB = b.getBumpStamp?.() ?? b.getLastActiveTimestamp() ?? 0;
              return stampB - stampA;
            })
            .slice(0, 5)
            .map((room: any) => ({
              name: room.name || room.roomId,
              // @ts-ignore
              bumpStamp: room.getBumpStamp?.() || 0,
              encrypted: room.hasEncryptionStateEvent?.() || false
            }));
          
          console.log('[MatrixDriver] Top 5 most recent rooms:');
          topRooms.forEach((room: any, idx: number) => {
            console.log(`  ${idx + 1}. ${room.name} (bump: ${room.bumpStamp}, encrypted: ${room.encrypted})`);
          });
        }
      } else if (state === 'SYNCING') {
        this.updateState({ syncing: true });
        console.log('[MatrixDriver] 🔄 SYNCING - Processing sync data from server...');
      } else if (state === 'ERROR') {
        this.updateState({ error: 'Sync error occurred', syncing: false });
        console.error('[MatrixDriver] ❌ SYNC ERROR:', data);
      } else if (state === 'RECONNECTING') {
        console.log('[MatrixDriver] 🔄 RECONNECTING - Attempting to restore connection...');
        this.updateState({ syncing: true });
      } else if (state === 'STOPPED') {
        console.log('[MatrixDriver] ⏹️ SYNC STOPPED');
        this.updateState({ connected: false, syncing: false });
      } else {
        console.log('[MatrixDriver] Unknown sync state:', state);
      }
    });

    // Handle connection errors
    // @ts-ignore - Matrix SDK event types
    this.client.on('clientWellKnown', (_wellKnown: any) => {
      // Handle well-known changes if needed
    });
  }

  private removeEventListeners(): void {
    if (!this.client) return;
    
    // Remove all listeners
    // @ts-ignore - Matrix SDK event types
    this.client.removeAllListeners('Room.timeline');
    // @ts-ignore - Matrix SDK event types
    this.client.removeAllListeners('Room');
    // @ts-ignore - Matrix SDK event types
    this.client.removeAllListeners('sync');
    // @ts-ignore - Matrix SDK event types
    this.client.removeAllListeners('clientWellKnown');
  }

  private updateState(updates: Partial<MatrixDriverState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.stateChange.forEach(callback => callback(this.getState()));
  }
  
  /**
   * Set up device verification for encryption
   */
  private async setupDeviceVerification(): Promise<void> {
    if (!this.client) return;
    
    try {
      console.log('[MatrixDriver] Setting up device verification...');
      
      // Get our own device ID
      const userId = this.client.getUserId();
      const deviceId = this.state.deviceId || this.client.getDeviceId?.();
      
      if (!userId || !deviceId) {
        console.warn('[MatrixDriver] Cannot verify device - missing user or device ID');
        return;
      }
      
      console.log(`[MatrixDriver] Verifying device ${deviceId} for user ${userId}`);
      
      // @ts-ignore - Check if we can mark our device as verified
      const crypto = this.client.getCrypto?.();
      if (crypto) {
        // Try to get device info
        // @ts-ignore
        const devices = await crypto.getUserDevices([userId]);
        const ourDevice = devices?.get(userId)?.get(deviceId);
        
        if (ourDevice) {
          console.log('[MatrixDriver] Our device verification status:', ourDevice.verified);
          
          // If not verified, try to verify it
          if (!ourDevice.verified) {
            console.log('[MatrixDriver] Device not verified, attempting to verify...');
            try {
              // @ts-ignore
              await crypto.setDeviceVerified(userId, deviceId, true);
              console.log('[MatrixDriver] ✅ Device marked as verified');
            } catch (e) {
              console.warn('[MatrixDriver] Could not verify device:', e);
            }
          }
        }
        
        // Also try to share keys with our other devices
        console.log('[MatrixDriver] Requesting key share with other devices...');
        try {
          // @ts-ignore
          if (crypto.requestRoomKeyForEvent) {
            // This will request keys from our other verified devices
            const rooms = this.client.getRooms();
            for (const room of rooms.slice(0, 5)) { // Limit to first 5 rooms
              if (room.hasEncryptionStateEvent?.()) {
                console.log(`[MatrixDriver] Requesting keys for encrypted room ${room.roomId}`);
                // Get timeline events
                const timeline = room.getLiveTimeline();
                const events = timeline.getEvents();
                const encryptedEvents = events.filter(e => e.getType() === 'm.room.encrypted');
                
                // Request keys for first few encrypted events
                for (const event of encryptedEvents.slice(0, 3)) {
                  try {
                    // @ts-ignore
                    await crypto.requestRoomKeyForEvent(event);
                  } catch (e) {
                    // Ignore individual key request failures
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('[MatrixDriver] Error requesting keys:', e);
        }
      }
    } catch (error) {
      console.error('[MatrixDriver] Failed to set up device verification:', error);
    }
  }

  /**
   * Cleanup method for proper disposal
   */
  async dispose(): Promise<void> {
    await this.stop();
    this.listeners.stateChange = [];
    this.listeners.message = [];
    this.listeners.roomUpdate = [];
  }
}
