/**
 * MatrixSessionBinder - Orchestrates Matrix client lifecycle with auth/session
 * Builds the driver from current auth/session, rebinds on login/logout/refresh
 * Exposes dispose/recreate functionality
 */

import * as sdk from "matrix-js-sdk";
import { MatrixDriver } from '@/drivers/matrix/MatrixDriver';
import { MatrixAdapter, matrixTokenService } from '@/adapters/matrix';
import { authService } from '@/network';
import { authConfig } from '@/kernel/auth/auth-config';
import type { ChatPort } from '@/kernel/ports/chat';
import type { User } from '@/kernel/auth/types/auth';

export interface MatrixSession {
  chatPort: ChatPort;
  driver: MatrixDriver;
  adapter: MatrixAdapter;
  isReady: boolean;
  error: string | null;
}

export class MatrixSessionBinder {
  private currentSession: MatrixSession | null = null;
  private listeners: Array<(session: MatrixSession | null) => void> = [];

  /**
   * Create a new Matrix session from current auth state
   */
  async createSession(user: User, zosAccessToken: string): Promise<MatrixSession> {
    // Clean up existing session
    await this.destroySession();

    try {
      // Validate inputs
      if (!user.matrixId) {
        throw new Error('User does not have a Matrix ID');
      }

      if (!user.matrixId.startsWith('@') || !user.matrixId.includes(':')) {
        throw new Error(`Invalid Matrix User ID format: ${user.matrixId}. Expected format: @username:domain`);
      }

      // Get Matrix SSO token
      console.log('[MatrixSessionBinder] Getting SSO token for user:', user.matrixId);
      const ssoResponse = await matrixTokenService.getSSOToken(zosAccessToken);
      const freshMatrixToken = ssoResponse.token;

      if (!freshMatrixToken || typeof freshMatrixToken !== 'string') {
        throw new Error(`Invalid Matrix SSO token received: ${typeof freshMatrixToken} - ${freshMatrixToken}`);
      }

      console.log('[MatrixSessionBinder] Got SSO token, length:', freshMatrixToken.length);

      // Check if we have a stored device ID for this user
      const deviceStorageKey = `matrix_device_${user.matrixId.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const storedDeviceId = localStorage.getItem(deviceStorageKey);
      
      if (storedDeviceId) {
        console.log('[MatrixSessionBinder] Found stored device ID:', storedDeviceId);
      }

      // Perform Matrix JWT login to get proper credentials
      const tempClient = sdk.createClient({
        baseUrl: authConfig.matrixHomeserverUrl,
      });

      console.log('[MatrixSessionBinder] Performing JWT login...');
      
      // Build login options - include device_id if we have one stored
      const loginOptions: any = {
        token: freshMatrixToken,
      };
      
      // If we have a stored device ID, pass it to try to reuse the same device
      if (storedDeviceId) {
        loginOptions.device_id = storedDeviceId;
        console.log('[MatrixSessionBinder] Attempting to reuse device ID:', storedDeviceId);
      }
      
      const loginRequest = await tempClient.login("org.matrix.login.jwt", loginOptions);

      console.log('[MatrixSessionBinder] JWT login response:', loginRequest);
      console.log('[MatrixSessionBinder] JWT login successful:', {
        userId: loginRequest.user_id,
        deviceId: loginRequest.device_id,
        hasAccessToken: !!loginRequest.access_token,
        tokenLength: loginRequest.access_token?.length,
        requestedDeviceId: storedDeviceId,
        receivedDeviceId: loginRequest.device_id,
        deviceReused: storedDeviceId === loginRequest.device_id
      });
      
      // Store the device ID for future use if it's the first time
      if (!storedDeviceId && loginRequest.device_id) {
        console.log('[MatrixSessionBinder] Storing device ID for future use:', loginRequest.device_id);
        localStorage.setItem(deviceStorageKey, loginRequest.device_id);
      } else if (storedDeviceId && loginRequest.device_id !== storedDeviceId) {
        console.warn('[MatrixSessionBinder] Server returned different device ID than requested!', {
          requested: storedDeviceId,
          received: loginRequest.device_id
        });
      }
      
      // Always use the device ID returned by the server
      const deviceIdToUse = loginRequest.device_id;

      // Create and initialize driver with the stored device ID
      const driver = new MatrixDriver();
      await driver.initialize({
        homeserverUrl: authConfig.matrixHomeserverUrl,
        accessToken: loginRequest.access_token,
        userId: loginRequest.user_id,
        deviceId: deviceIdToUse,  // Use the stored device ID to maintain consistency
      });

      // Start syncing to get the most recent 20 rooms
      console.log('[MatrixSessionBinder] Starting sync for recent rooms...');
      try {
        await driver.start();
        console.log('[MatrixSessionBinder] Sync started successfully');
      } catch (syncError) {
        console.error('[MatrixSessionBinder] Failed to start sync:', syncError);
        // Continue anyway - the session is created, sync can be retried later
      }

      // Create adapter
      const adapter = new MatrixAdapter(driver);

      // Create session object
      const session: MatrixSession = {
        chatPort: adapter,
        driver,
        adapter,
        isReady: driver.isReady(),
        error: null,
      };

      // Listen to driver state changes to update session readiness
      driver.onStateChange((state) => {
        if (this.currentSession === session) {
          this.currentSession.isReady = state.connected && !state.error;
          this.currentSession.error = state.error;
          this.notifyListeners(this.currentSession);
        }
      });

      this.currentSession = session;
      this.notifyListeners(session);

      return session;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Create error session
      const errorSession: MatrixSession = {
        chatPort: this.createNullChatPort(),
        driver: new MatrixDriver(), // Empty driver
        adapter: new MatrixAdapter(new MatrixDriver()), // Empty adapter
        isReady: false,
        error: errorMessage,
      };

      this.currentSession = errorSession;
      this.notifyListeners(errorSession);
      
      throw error;
    }
  }

  /**
   * Destroy the current session
   */
  async destroySession(): Promise<void> {
    if (this.currentSession) {
      try {
        await this.currentSession.driver.dispose();
        this.currentSession.adapter.dispose();
      } catch (error) {
        console.error('Error disposing Matrix session:', error);
      }

      this.currentSession = null;
      this.notifyListeners(null);
    }

    // Clear token service
    matrixTokenService.clearMatrixToken();
  }

  /**
   * Get the current session
   */
  getCurrentSession(): MatrixSession | null {
    return this.currentSession;
  }

  /**
   * Get the current chat port (convenience method)
   */
  getChatPort(): ChatPort | null {
    return this.currentSession?.chatPort || null;
  }

  /**
   * Check if session is ready
   */
  isSessionReady(): boolean {
    return this.currentSession?.isReady || false;
  }

  /**
   * Recreate session with fresh credentials
   * Note: This would need to get user from auth store or be passed user as parameter
   */
  async recreateSession(user?: User): Promise<MatrixSession | null> {
    const currentToken = authService.getCurrentToken();

    if (!user || !currentToken) {
      await this.destroySession();
      return null;
    }

    return await this.createSession(user, currentToken);
  }

  /**
   * Subscribe to session changes
   */
  onSessionChange(callback: (session: MatrixSession | null) => void): () => void {
    this.listeners.push(callback);
    
    // Immediately call with current session
    callback(this.currentSession);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Handle auth state changes (login/logout/token refresh)
   */
  async handleAuthChange(user: User | null, token: string | null): Promise<void> {
    if (!user || !token) {
      // User logged out
      await this.destroySession();
      return;
    }

    if (!user.matrixId) {
      // User doesn't have Matrix integration
      await this.destroySession();
      return;
    }

    try {
      // Create new session with updated credentials
      await this.createSession(user, token);
    } catch (error) {
      console.error('Failed to create Matrix session after auth change:', error);
      // Session will be in error state, which is handled above
    }
  }

  private notifyListeners(session: MatrixSession | null): void {
    this.listeners.forEach(callback => {
      try {
        callback(session);
      } catch (error) {
        console.error('Error in session change listener:', error);
      }
    });
  }

  private createNullChatPort(): ChatPort {
    // Null object pattern for when no session is available
    return {
      getRooms: async () => [],
      getRoom: async () => null,
      joinRoom: async () => { throw new Error('No Matrix session available'); },
      leaveRoom: async () => { throw new Error('No Matrix session available'); },
      getMessages: async () => [],
      sendMessage: async () => { throw new Error('No Matrix session available'); },
      getCurrentUser: async () => null,
      getRoomMembers: async () => [],
      isConnected: () => false,
      connect: async () => { throw new Error('No Matrix session available'); },
      disconnect: async () => {},
      onMessage: () => () => {},
      onRoomUpdate: () => () => {},
      onConnectionChange: () => () => {},
    };
  }

  /**
   * Cleanup method
   */
  async dispose(): Promise<void> {
    await this.destroySession();
    this.listeners = [];
  }
}

// Export singleton instance
export const matrixSessionBinder = new MatrixSessionBinder();
