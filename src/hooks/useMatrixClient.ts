import { useEffect, useState } from "react";
import * as sdk from "matrix-js-sdk";
import type { MatrixClient } from "matrix-js-sdk";
import { useAuthStore } from '@/stores/authStore';
import { matrixService, authService } from '@/api';

export function useMatrixClient() {
  console.log('🚀 useMatrixClient hook called');
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [client, setClient] = useState<MatrixClient | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Get credentials from auth store and auth service
  const matrixUserId = user?.matrixId;
  const zosAccessToken = authService.getCurrentToken();

  // Debug: Always log the current state
  console.log('🔍 useMatrixClient state:', {
    isAuthenticated,
    user: user ? 'present' : 'null',
    matrixUserId: matrixUserId || 'null',
    zosAccessToken: zosAccessToken ? `${zosAccessToken.slice(0, 20)}...` : 'null'
  });

  // Debug: Check if token is actually in the auth service
  console.log('🔍 Auth service token check:', {
    hasToken: !!authService.getCurrentToken(),
    tokenPreview: authService.getCurrentToken()?.slice(0, 30) + '...' || 'null'
  });

  useEffect(() => {
    if (!isAuthenticated || !matrixUserId || !zosAccessToken) {
      console.log('❌ Missing required credentials:', {
        isAuthenticated,
        hasMatrixUserId: !!matrixUserId,
        hasZosAccessToken: !!zosAccessToken
      });
      return;
    }

    let stopped = false;

    (async () => {
      try {
        console.log('🔐 Starting Matrix client initialization...');
        console.log('  Matrix User ID:', matrixUserId);
        console.log('  ZOS Access Token:', zosAccessToken.slice(0, 30) + '...');

        // First, get the Matrix SSO token from the service using ZOS token
        console.log('📡 Calling getSSOToken() with ZOS token...');
        const ssoResponse = await matrixService.getSSOToken(zosAccessToken);
        
        console.log('🔍 SSO Response received:', ssoResponse);
        console.log('🔍 SSO Response type:', typeof ssoResponse);
        console.log('🔍 SSO Response keys:', Object.keys(ssoResponse));
        
        const freshMatrixToken = ssoResponse.token;
        
        console.log('✅ Matrix SSO token obtained:', freshMatrixToken);
        console.log('🔍 Matrix token type:', typeof freshMatrixToken);
        console.log('🔍 Matrix token length:', freshMatrixToken?.length || 0);
        
        // Verify we have a valid Matrix token before creating client
        if (!freshMatrixToken || typeof freshMatrixToken !== 'string') {
          throw new Error(`Invalid Matrix SSO token received: ${typeof freshMatrixToken} - ${freshMatrixToken}`);
        }

        // Create Matrix client with the fresh token
        console.log('🔧 Creating Matrix client with:');
        console.log('  baseUrl: https://zos-home-2-e24b9412096f.herokuapp.com');
        console.log('  accessToken (Matrix SSO):', freshMatrixToken.slice(0, 40) + '...');
        console.log('  userId:', matrixUserId);
        
        const matrixClient = sdk.createClient({
          baseUrl: 'https://zos-home-2-e24b9412096f.herokuapp.com',
          accessToken: freshMatrixToken,
          userId: matrixUserId,
        });

        console.log('✅ Matrix client created');
        console.log('  client.getAccessToken():', matrixClient.getAccessToken()?.slice(0, 40) + '...');
        console.log('  client.getUserId():', matrixClient.getUserId());
        
        // Verify the client has the correct token
        const clientToken = matrixClient.getAccessToken();
        const tokensMatch = clientToken === freshMatrixToken;
        console.log('🔍 Token verification:', {
          clientHasToken: !!clientToken,
          tokensMatch,
          clientTokenPreview: clientToken?.slice(0, 30) + '...',
          originalTokenPreview: freshMatrixToken.slice(0, 30) + '...'
        });

        // Test whoami call
        console.log('📡 Calling whoami...');
        const whoamiResult = await matrixClient.whoami();
        console.log('👤 Whoami success:', whoamiResult);

        if (!stopped) {
          setClient(matrixClient);
          setReady(true);
          setDeviceId(whoamiResult.device_id || null);
        }

      } catch (err) {
        console.error('❌ Matrix client initialization failed:', err);
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

  return {
    client,
    ready,
    error,
    deviceId,
    matrixUserId,
    hasMatrixUserId: !!matrixUserId,
  };
}