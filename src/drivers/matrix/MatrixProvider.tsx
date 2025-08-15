import React, { createContext, useContext, useEffect, useState } from 'react';
import * as sdk from "matrix-js-sdk";
import type { MatrixClient } from "matrix-js-sdk";
import { useAuthStore } from '@/kernel/auth/store/authStore';
import { matrixService, authService } from '@/api';
import { authConfig } from '@/kernel/auth/auth-config';

interface MatrixContextType {
  client: MatrixClient | null;
  ready: boolean;
  error: unknown | null;
  deviceId: string | null;
  matrixUserId: string | null;
  hasMatrixUserId: boolean;
}

const MatrixContext = createContext<MatrixContextType>({
  client: null,
  ready: false,
  error: null,
  deviceId: null,
  matrixUserId: null,
  hasMatrixUserId: false,
});

export function MatrixProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [client, setClient] = useState<MatrixClient | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Get credentials from auth store and auth service
  const matrixUserId = user?.matrixId;
  const zosAccessToken = authService.getCurrentToken();

  useEffect(() => {
    if (!isAuthenticated || !matrixUserId || !zosAccessToken) {
      return;
    }

    let stopped = false;

    (async () => {
      try {
        // Validate Matrix User ID format
        if (!matrixUserId.startsWith('@') || !matrixUserId.includes(':')) {
          throw new Error(`Invalid Matrix User ID format: ${matrixUserId}. Expected format: @username:domain`);
        }

        // Get the Matrix SSO token from the service using ZOS token
        const ssoResponse = await matrixService.getSSOToken(zosAccessToken);
        const freshMatrixToken = ssoResponse.token;
        
        // Verify we have a valid Matrix token
        if (!freshMatrixToken || typeof freshMatrixToken !== 'string') {
          throw new Error(`Invalid Matrix SSO token received: ${typeof freshMatrixToken} - ${freshMatrixToken}`);
        }

        // Create a temporary client for JWT login
        const tempClient = sdk.createClient({
          baseUrl: authConfig.matrixHomeserverUrl,
        });
        
        // Perform Matrix JWT login
        const loginRequest = await tempClient.login("org.matrix.login.jwt", {
          token: freshMatrixToken,
        });

        // Create the real client with the login credentials
        const matrixClient = sdk.createClient({
          baseUrl: authConfig.matrixHomeserverUrl,
          accessToken: loginRequest.access_token,
          userId: loginRequest.user_id,
          deviceId: loginRequest.device_id,
        });

        // Get device_id from whoami
        const { device_id } = await matrixClient.whoami();

        // Test: Fetch recent messages from joined rooms
        try {
          const rooms = matrixClient.getRooms();
          const joinedRooms = rooms.filter(room => room.getMyMembership() === 'join');
          const recentMessages = [];
          
          // Get messages from up to 3 most recent rooms to limit API calls
          const roomsToCheck = joinedRooms.slice(0, 3);
          
          for (const room of roomsToCheck) {
            try {
              // Get room timeline events
              const timeline = room.getLiveTimeline();
              const events = timeline.getEvents();
              
              // Filter for message events and get the last few
              const messageEvents = events
                .filter(event => event.getType() === 'm.room.message')
                .slice(-7) // Get last 7 messages per room
                .map(event => ({
                  roomId: room.roomId,
                  roomName: room.name || room.roomId,
                  sender: event.getSender(),
                  content: event.getContent().body || '[No content]',
                  timestamp: new Date(event.getTs()).toISOString(),
                  eventId: event.getId()
                }));

              recentMessages.push(...messageEvents);
            } catch (roomError) {
              // Silently handle room errors
            }
          }

          // Sort by timestamp and get last 20 (for potential future use)
          recentMessages
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20);

        } catch (messagesError) {
          // Silently handle message fetch errors
        }

        if (!stopped) {
          setClient(matrixClient);
          setReady(true);
          setDeviceId(device_id || null);
        }

      } catch (err) {
        if (!stopped) {
          setError(err);
        }
      }
    })();

    return () => {
      stopped = true;
      setClient(null);
      setReady(false);
      setError(null);
      setDeviceId(null);
    };
  }, [isAuthenticated, matrixUserId, zosAccessToken]);

  const value: MatrixContextType = {
    client,
    ready,
    error,
    deviceId,
    matrixUserId: matrixUserId || null,
    hasMatrixUserId: !!matrixUserId,
  };

  return (
    <MatrixContext.Provider value={value}>
      {children}
    </MatrixContext.Provider>
  );
}

export function useMatrixClient(): MatrixContextType {
  const context = useContext(MatrixContext);
  if (!context) {
    throw new Error('useMatrixClient must be used within a MatrixProvider');
  }
  return context;
}
