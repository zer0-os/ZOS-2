/**
 * MatrixAdapter - Implements ChatPort interface
 * Translates between Matrix shapes and domain models
 * Orchestrates calls using the MatrixDriver
 * Stateless/pure as possible
 */

import type { ChatPort, ChatMessage, ChatRoom, ChatUser } from '@/kernel/ports/chat';
import type { MatrixDriver } from '@/drivers/matrix/MatrixDriver';
import type { MatrixEvent, Room } from 'matrix-js-sdk';
import { ApiError } from '../network/http-client';

export interface MatrixSSOTokenResponse {
  token: string;
}

export interface MatrixConfig {
  homeserverUrl?: string;
  accessToken?: string;
  userId?: string;
}

/**
 * Matrix SSO Token Service
 * Handles token exchange with Zero API - separate from chat functionality
 */
export class MatrixTokenService {
  private matrixAccessToken: string | null = null;
  private matrixUserId: string | null = null;
  private lastZeroToken: string | null = null;

  getCurrentMatrixToken(): string | null {
    return this.matrixAccessToken;
  }

  getCurrentMatrixUserId(): string | null {
    return this.matrixUserId;
  }

  setCurrentMatrixToken(token: string | null): void {
    this.matrixAccessToken = token;
  }

  setCurrentMatrixUserId(userId: string | null): void {
    this.matrixUserId = userId;
  }

  clearMatrixToken(): void {
    this.matrixAccessToken = null;
    this.matrixUserId = null;
    this.lastZeroToken = null;
  }

  /**
   * Get Matrix SSO token using Zero access token
   */
  async getSSOToken(zeroAccessToken: string): Promise<MatrixSSOTokenResponse> {
    if (!zeroAccessToken) {
      throw new ApiError(400, 'MISSING_ACCESS_TOKEN', 'Zero access token is required for Matrix SSO token request');
    }

    // Check if we already have a valid Matrix token for this ZOS token
    if (this.matrixAccessToken && this.lastZeroToken === zeroAccessToken) {
      return { token: this.matrixAccessToken };
    }

    try {
      const baseUrl = 'https://zosapi.zero.tech';
      const endpoint = `${baseUrl}/accounts/ssoToken`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${zeroAccessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(
          response.status,
          'MATRIX_SSO_ERROR',
          `Matrix SSO request failed: ${response.status} ${response.statusText}`,
          { 
            responseText: errorText,
            endpoint,
            tokenUsed: zeroAccessToken
          }
        );
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        throw new ApiError(
          500,
          'UNEXPECTED_RESPONSE_FORMAT',
          `Matrix SSO endpoint returned array instead of object: ${JSON.stringify(data)}`
        );
      }

      if (!data || !data.token || typeof data.token !== 'string') {
        throw new ApiError(
          500,
          'INVALID_TOKEN_FORMAT',
          `Matrix SSO response missing or invalid token: ${JSON.stringify(data)}`,
          { responseData: data }
        );
      }

      this.setCurrentMatrixToken(data.token);
      this.lastZeroToken = zeroAccessToken;

      return data;
    } catch (error) {
      this.clearMatrixToken();
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        500,
        'MATRIX_SSO_TOKEN_ERROR',
        'Failed to retrieve Matrix SSO token',
        { originalError: error }
      );
    }
  }

  hasMatrixToken(): boolean {
    return !!this.matrixAccessToken;
  }

  hasValidMatrixTokenFor(zeroAccessToken: string): boolean {
    return !!(this.matrixAccessToken && this.lastZeroToken === zeroAccessToken);
  }

  isValidMatrixToken(token?: string): boolean {
    const tokenToCheck = token || this.matrixAccessToken;
    return !!(tokenToCheck && typeof tokenToCheck === 'string' && tokenToCheck.length > 10);
  }

  setMatrixUserIdFromProfile(matrixId: string | undefined): void {
    if (matrixId) {
      this.setCurrentMatrixUserId(matrixId);
    }
  }

  getMatrixConfig(homeserverUrl?: string): MatrixConfig {
    return {
      homeserverUrl: homeserverUrl || 'https://zos-home-2-e24b9412096f.herokuapp.com',
      accessToken: this.matrixAccessToken || undefined,
      userId: this.matrixUserId || undefined,
    };
  }
}

/**
 * MatrixAdapter - Implements ChatPort using MatrixDriver
 */
export class MatrixAdapter implements ChatPort {
  private driver: MatrixDriver;
  private messageCallbacks: Array<(message: ChatMessage) => void> = [];
  private roomCallbacks: Array<(room: ChatRoom) => void> = [];
  private connectionCallbacks: Array<(connected: boolean) => void> = [];

  constructor(driver: MatrixDriver) {
    this.driver = driver;
    this.setupDriverListeners();
  }

  // Room operations
  async getRooms(): Promise<ChatRoom[]> {
    const client = this.driver.getClient();
    if (!client) {
      throw new Error('Matrix client not available');
    }

    // Ensure client is syncing to get room data
    if (!this.driver.hasSyncStarted()) {
      console.log('[MatrixAdapter] Starting sync to get room data...');
      try {
        await this.driver.start();
      } catch (error) {
        console.error('[MatrixAdapter] Failed to start sync:', error);
        // Try to continue anyway - might have cached data
      }
    }

    const rooms = client.getRooms();
    
    // Filter to joined rooms and sort by bump stamp to get most recent
    const sortedRooms = rooms
      .filter(room => room.getMyMembership() === 'join')
      .sort((a, b) => {
        // @ts-ignore - getBumpStamp might not be in type definitions
        const stampA = a.getBumpStamp?.() ?? a.getLastActiveTimestamp() ?? 0;
        // @ts-ignore
        const stampB = b.getBumpStamp?.() ?? b.getLastActiveTimestamp() ?? 0;
        return stampB - stampA; // Descending order (most recent first)
      })
      .slice(0, 20); // Only return the 20 most recent rooms
    
    console.log(`[MatrixAdapter] Returning ${sortedRooms.length} most recent rooms out of ${rooms.length} total`);
    
    return sortedRooms.map(room => this.mapRoomToChatRoom(room));
  }

  async getRoom(roomId: string): Promise<ChatRoom | null> {
    const client = this.driver.getClient();
    if (!client) {
      throw new Error('Matrix client not available');
    }

    const room = client.getRoom(roomId);
    if (!room) return null;

    return this.mapRoomToChatRoom(room);
  }

  async joinRoom(roomId: string): Promise<void> {
    const client = this.driver.getClient();
    if (!client) {
      throw new Error('Matrix client not available');
    }

    await client.joinRoom(roomId);
  }

  async leaveRoom(roomId: string): Promise<void> {
    const client = this.driver.getClient();
    if (!client) {
      throw new Error('Matrix client not available');
    }

    await client.leave(roomId);
  }

  // Message operations
  async getMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    const client = this.driver.getClient();
    if (!client) {
      throw new Error('Matrix client not available');
    }

    // Wait for sync to be ready before trying to get messages
    const syncState = client.getSyncState();
    console.log(`[MatrixAdapter] Current sync state: ${syncState}`);
    
    if (syncState !== 'PREPARED' && syncState !== 'SYNCING') {
      console.log(`[MatrixAdapter] Sync not ready, but proceeding to show messages quickly`);
      // Don't wait for sync - show messages immediately even if partial
      // The room might already have cached messages we can display
    }

    const room = client.getRoom(roomId);
    if (!room) {
      console.error(`[MatrixAdapter] Room ${roomId} not found`);
      // List all available rooms for debugging
      const allRooms = client.getRooms();
      console.log(`[MatrixAdapter] Available rooms: ${allRooms.map(r => `${r.roomId} (${r.name})`).join(', ')}`);
      throw new Error(`Room ${roomId} not found`);
    }

    console.log(`[MatrixAdapter] Getting messages for room ${roomId} (${room.name})`);

    // Get the live timeline
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();
    
    console.log(`[MatrixAdapter] Initial timeline has ${events.length} events`);

    // If we don't have enough events in the timeline, try to paginate backwards
    if (events.length < limit) {
      console.log(`[MatrixAdapter] Paginating to load ${limit} messages for room ${roomId}`);
      try {
        // @ts-ignore - Matrix SDK method
        await client.paginateEventTimeline(timeline, {
          backwards: true,
          limit: limit
        });
        console.log(`[MatrixAdapter] Pagination completed`);
      } catch (error) {
        console.warn('[MatrixAdapter] Failed to paginate timeline:', error);
      }
    }

    // Get updated events after pagination
    const allEvents = timeline.getEvents();
    console.log(`[MatrixAdapter] After pagination: ${allEvents.length} total events`);
    
    // Log event types for debugging
    const eventTypes = allEvents.reduce((acc, event) => {
      const type = event.getType();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`[MatrixAdapter] Event types:`, eventTypes);
    
    // Check if room is encrypted
    const isEncrypted = room.hasEncryptionStateEvent?.() || false;
    console.log(`[MatrixAdapter] Room ${roomId} encrypted: ${isEncrypted}`);
    
    if (isEncrypted) {
      // Check if crypto is enabled
      // @ts-ignore - isCryptoEnabled might not be in type definitions
      const cryptoEnabled = client.isCryptoEnabled?.() || false;
      console.log(`[MatrixAdapter] Crypto enabled: ${cryptoEnabled}`);
      
      if (!cryptoEnabled) {
        console.warn('[MatrixAdapter] ⚠️ Room is encrypted but crypto is not enabled!');
      }
    }
    
    // Filter for message events and transform them
    const messageEvents = allEvents.filter(event => {
      const type = event.getType();
      // Include both regular messages and encrypted messages
      return type === 'm.room.message' || type === 'm.room.encrypted';
    });
    console.log(`[MatrixAdapter] Found ${messageEvents.length} message events (including encrypted)`);
    
    // Process messages - need to handle decryption properly
    const processedMessages: ChatMessage[] = [];
    
    for (const event of messageEvents.slice(-limit)) {
      try {
        // For encrypted events, attempt quick decryption without delays
        if (event.getType() === 'm.room.encrypted') {
          // First check if already decrypted
          let clearContent = event.getClearContent?.();
          
          if (!clearContent || !clearContent.msgtype) {
            console.log(`[MatrixAdapter] Encrypted event ${event.getId()}, attempting quick decrypt...`);
            
            // Try a single quick decrypt attempt (no retries, no delays)
            try {
              // @ts-ignore - decryptEventIfNeeded might not be in type definitions
              if (client.decryptEventIfNeeded) {
                // @ts-ignore
                await client.decryptEventIfNeeded(event);
                clearContent = event.getClearContent?.();
              }
            } catch (decryptError) {
              console.warn(`[MatrixAdapter] Quick decrypt failed for ${event.getId()}:`, decryptError);
            }
            
            // If still not decrypted, immediately show as failed (no waiting)
            if (!clearContent || !clearContent.msgtype) {
              console.log(`[MatrixAdapter] Event ${event.getId()} not decrypted, showing placeholder`);
              
              // Fire off a key request in background (don't wait for it)
              // @ts-ignore
              if (client.crypto?.requestRoomKey) {
                try {
                  const wireContent = event.getWireContent();
                  // @ts-ignore - Request key but don't wait
                  client.crypto.requestRoomKey({
                    algorithm: wireContent.algorithm,
                    room_id: event.getRoomId(),
                    session_id: wireContent.session_id,
                    sender_key: wireContent.sender_key,
                  }, [event.getSender()], true).catch((err: any) => {
                    console.warn(`[MatrixAdapter] Background key request failed:`, err);
                  });
                } catch (err) {
                  // Ignore errors in background key request
                }
              }
              
              // Immediately add the failed decrypt message
              processedMessages.push({
                id: event.getId() || `unknown-${Date.now()}`,
                roomId: room.roomId,
                sender: event.getSender() || 'unknown',
                content: '🔒 Failed to decrypt message',
                timestamp: event.getTs(),
                type: 'text'
              });
              continue;
            } else {
              console.log(`[MatrixAdapter] Successfully decrypted event ${event.getId()}`);
            }
          }
        }
        
        const message = this.mapEventToChatMessage(event, room);
        if (message) {
          processedMessages.push(message);
        }
      } catch (e) {
        console.error(`[MatrixAdapter] Failed to process event ${event.getId()}:`, e);
      }
    }
    
    console.log(`[MatrixAdapter] Returning ${processedMessages.length} messages after processing`);
    return processedMessages;
  }

  async loadMoreMessages(roomId: string, _fromToken?: string, limit: number = 50): Promise<ChatMessage[]> {
    const client = this.driver.getClient();
    if (!client) {
      throw new Error('Matrix client not available');
    }

    const room = client.getRoom(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    // Paginate backwards from the current position
    const timeline = room.getLiveTimeline();
    
    try {
      // @ts-ignore - Matrix SDK method
      const paginationResult = await client.paginateEventTimeline(timeline, {
        backwards: true,
        limit: limit
      });

      if (!paginationResult) {
        return []; // No more messages to load
      }

      // Get the newly loaded events
      const events = timeline.getEvents();
      
      return events
        .filter(event => event.getType() === 'm.room.message')
        .slice(0, limit) // Get the oldest messages that were just loaded
        .map(event => this.mapEventToChatMessage(event, room));
    } catch (error) {
      console.error('[MatrixAdapter] Failed to load more messages:', error);
      return [];
    }
  }

  async sendMessage(roomId: string, content: string): Promise<ChatMessage> {
    const client = this.driver.getClient();
    if (!client) {
      throw new Error('Matrix client not available');
    }

    const response = await client.sendTextMessage(roomId, content);
    
    // Create a temporary message object since we don't have the full event yet
    return {
      id: response.event_id || `temp-${Date.now()}`,
      roomId,
      sender: client.getUserId() || 'unknown',
      content,
      timestamp: Date.now(),
      type: 'text'
    };
  }

  async focusRoom(roomId: string, messageLimit: number = 50): Promise<void> {
    // Call the driver's focusRoom method to ensure messages are loaded
    await this.driver.focusRoom(roomId, messageLimit);
  }

  // User operations
  async getCurrentUser(): Promise<ChatUser | null> {
    const client = this.driver.getClient();
    if (!client) return null;

    const userId = client.getUserId();
    if (!userId) return null;

    try {
      const profile = await client.getProfileInfo(userId);
      return {
        id: userId,
        displayName: profile.displayname,
        avatarUrl: profile.avatar_url,
        presence: 'online' // Matrix presence would need separate API call
      };
    } catch (error) {
      return {
        id: userId,
        displayName: userId,
        presence: 'online'
      };
    }
  }

  async getRoomMembers(roomId: string): Promise<ChatUser[]> {
    const client = this.driver.getClient();
    if (!client) {
      throw new Error('Matrix client not available');
    }

    const room = client.getRoom(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const members = room.getJoinedMembers();
    return Object.values(members).map(member => ({
      id: member.userId,
      displayName: member.name,
      avatarUrl: member.getAvatarUrl(client.baseUrl, 64, 64, 'crop', false, false) || undefined,
      presence: 'online' // Would need presence API
    }));
  }

  // Connection state
  isConnected(): boolean {
    return this.driver.isReady();
  }

  async connect(): Promise<void> {
    await this.driver.start();
  }

  async disconnect(): Promise<void> {
    await this.driver.stop();
  }

  async waitForSync(timeoutMs?: number): Promise<void> {
    await this.driver.waitForSync(timeoutMs);
  }

  // Event handling
  onMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  onRoomUpdate(callback: (room: ChatRoom) => void): () => void {
    this.roomCallbacks.push(callback);
    return () => {
      const index = this.roomCallbacks.indexOf(callback);
      if (index > -1) {
        this.roomCallbacks.splice(index, 1);
      }
    };
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  // Private helper methods
  private setupDriverListeners(): void {
    // Listen to driver messages and translate to domain events
    this.driver.onMessage((event, room) => {
      const message = this.mapEventToChatMessage(event, room);
      this.messageCallbacks.forEach(callback => callback(message));
      
      // Also trigger room update when a new message arrives
      // This ensures the room list re-sorts by bumpStamp
      const chatRoom = this.mapRoomToChatRoom(room);
      this.roomCallbacks.forEach(callback => callback(chatRoom));
    });

    // Listen to driver room updates
    this.driver.onRoomUpdate((room) => {
      const chatRoom = this.mapRoomToChatRoom(room);
      this.roomCallbacks.forEach(callback => callback(chatRoom));
    });

    // Listen to driver state changes
    this.driver.onStateChange((state) => {
      const connected = state.connected && !state.error;
      this.connectionCallbacks.forEach(callback => callback(connected));
    });
  }

  private mapRoomToChatRoom(room: Room): ChatRoom {
    const roomType = this.determineRoomType(room);
    
    // Use getBumpStamp() for sliding sync recency (MSC4186)
    // This is a monotonic index that increases with activity
    // @ts-ignore - getBumpStamp might not be in type definitions yet
    const bumpStamp = room.getBumpStamp?.() || 0;
    
    // Also keep lastActiveTimestamp as fallback
    const lastActiveTimestamp = room.getLastActiveTimestamp();

    // Don't include any messages - pure lazy loading
    // Messages will only be fetched when a room is actually opened

    return {
      id: room.roomId,
      name: room.name || room.roomId,
      type: roomType,
      memberCount: room.getJoinedMemberCount(),
      lastMessage: undefined, // No messages until room is opened
      lastActiveTimestamp,
      bumpStamp,
      isJoined: room.getMyMembership() === 'join',
      isEncrypted: room.hasEncryptionStateEvent()
    };
  }

  private mapEventToChatMessage(event: MatrixEvent, room: Room): ChatMessage {
    let content = event.getContent();
    
    // For encrypted events, try to get the decrypted content
    if (event.getType() === 'm.room.encrypted') {
      const clearContent = event.getClearContent?.();
      if (clearContent) {
        content = clearContent;
        console.log(`[MatrixAdapter] Using decrypted content for event ${event.getId()}`);
      } else {
        console.warn(`[MatrixAdapter] Could not decrypt event ${event.getId()}`);
        // Return a placeholder for undecrypted messages - still show them
        return {
          id: event.getId() || `unknown-${Date.now()}`,
          roomId: room.roomId,
          sender: event.getSender() || 'unknown',
          content: '🔒 Failed to decrypt message',
          timestamp: event.getTs(),
          type: 'text'
        };
      }
    }
    
    return {
      id: event.getId() || `unknown-${Date.now()}`,
      roomId: room.roomId,
      sender: event.getSender() || 'unknown',
      content: content.body || content.text || '[No content]',
      timestamp: event.getTs(),
      type: this.determineMessageType(content)
    };
  }

  private determineRoomType(room: Room): 'direct' | 'group' | 'channel' {
    // Simple heuristic - could be improved with room state analysis
    const memberCount = room.getJoinedMemberCount();
    const roomName = room.name || '';
    
    if (memberCount === 2) return 'direct';
    if (roomName.startsWith('#')) return 'channel';
    return 'group';
  }

  private determineMessageType(content: any): 'text' | 'image' | 'file' {
    if (content.msgtype === 'm.image') return 'image';
    if (content.msgtype === 'm.file') return 'file';
    return 'text';
  }



  /**
   * Cleanup method
   */
  dispose(): void {
    this.messageCallbacks = [];
    this.roomCallbacks = [];
    this.connectionCallbacks = [];
  }
}

// Export singleton instances for backward compatibility
export const matrixTokenService = new MatrixTokenService();

// Note: MatrixAdapter instances should be created by the session binder
// export const matrixAdapter = new MatrixAdapter(matrixDriver); // Will be handled by session binder