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

    this.updateState({ error: null });

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
      
      this.client = sdk.createClient({
        baseUrl: config.homeserverUrl,
        accessToken: config.accessToken,
        userId: config.userId,
        deviceId: config.deviceId,
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
        
        if (!cryptoEnabled) {
          // @ts-ignore - Try Rust crypto first (newer SDK)
          if (this.client.initRustCrypto) {
            console.log('[MatrixDriver] 🔐 Initializing Rust crypto...');
            // @ts-ignore
            await this.client.initRustCrypto();
          }
          // @ts-ignore - Fall back to legacy crypto
          else if (this.client.initCrypto) {
            console.log('[MatrixDriver] 🔐 Initializing legacy crypto...');
            // @ts-ignore
            await this.client.initCrypto();
          } else {
            console.warn('[MatrixDriver] ⚠️ No crypto initialization method available');
          }
          
          // @ts-ignore - Verify crypto is enabled
          const nowEnabled = this.client.isCryptoEnabled?.() || this.client.getCrypto?.() !== null;
          console.log('[MatrixDriver] ✅ Crypto initialization complete. Enabled:', nowEnabled);
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
      
      // Configure sync options - minimize initial data transfer
      const syncOptions = {
        // Minimal initial sync - only 1 event per room to get room list quickly
        initialSyncLimit: 1,
        
        // Include only joined rooms, not archived
        includeArchivedRooms: false,
        
        // Use lazy loading for room members to reduce data
        lazyLoadMembers: true,
        
        // Polling timeout for long polling
        pollTimeout: 30000,
        
        // Don't sync presence to reduce overhead
        disablePresence: true,
        
        // Note: We only need room metadata, not messages
        // Messages will be fetched lazily when rooms are opened
      };
      
      // Start syncing with the server
      // @ts-ignore - Some options might not be in type definitions
      await this.client.startClient(syncOptions);
      this.syncStarted = true;
      
      console.log('[MatrixDriver] ✅ Sync started - waiting for PREPARED state...');
      
      this.updateState({ connected: true, syncing: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start client';
      console.error('[MatrixDriver] Failed to start client:', error);
      this.updateState({ error: errorMessage, syncing: false });
      throw error;
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

    // Handle sync state changes
    // @ts-ignore - Matrix SDK event types
    this.client.on('sync', (state: string) => {
      if (state === 'PREPARED') {
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
        console.log('[MatrixDriver] Syncing...');
      } else if (state === 'ERROR') {
        this.updateState({ error: 'Sync error occurred', syncing: false });
        console.error('[MatrixDriver] Sync error occurred');
      } else {
        console.log('[MatrixDriver] Sync state changed to:', state);
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
   * Cleanup method for proper disposal
   */
  async dispose(): Promise<void> {
    await this.stop();
    this.listeners.stateChange = [];
    this.listeners.message = [];
    this.listeners.roomUpdate = [];
  }
}
