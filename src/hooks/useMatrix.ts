import { useAuthStore } from '@/stores/authStore';
import { matrixService } from '@/api';

/**
 * Custom hook for Matrix integration
 * Provides easy access to Matrix token and status
 */
export function useMatrix() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Get Matrix token from user object or service memory
  const matrixToken = user?.matrixAccessToken || matrixService.getCurrentMatrixToken();
  
  // Check if Matrix integration is available
  const hasMatrixToken = !!matrixToken;
  const isMatrixEnabled = isAuthenticated && hasMatrixToken;

  // Get Matrix configuration for client initialization
  const getMatrixConfig = (homeserverUrl?: string) => {
    return matrixService.getMatrixConfig(homeserverUrl);
  };

  // Validate Matrix token
  const isValidToken = matrixService.isValidMatrixToken(matrixToken);

  // Manual token refresh (if needed)
  const refreshMatrixToken = async () => {
    const zeroToken = matrixService.getCurrentMatrixToken();
    if (!zeroToken) {
      throw new Error('No Zero access token available for Matrix token refresh');
    }
    
    try {
      const response = await matrixService.getSSOToken(zeroToken);
      return response.token;
    } catch (error) {
      console.error('Failed to refresh Matrix token:', error);
      throw error;
    }
  };

  return {
    // Token information
    matrixToken,
    hasMatrixToken,
    isMatrixEnabled,
    isValidToken,
    
    // Configuration
    getMatrixConfig,
    
    // Actions
    refreshMatrixToken,
    
    // Status helpers
    canUseMatrix: isMatrixEnabled && isValidToken,
    matrixStatus: {
      authenticated: isAuthenticated,
      hasToken: hasMatrixToken,
      validToken: isValidToken,
      ready: isMatrixEnabled && isValidToken,
    },
  };
}

/**
 * Hook to get Matrix token with automatic fallback
 */
export function useMatrixToken(): string | null {
  const { matrixToken } = useMatrix();
  return matrixToken;
}

/**
 * Hook to check if Matrix features are available
 */
export function useMatrixEnabled(): boolean {
  const { canUseMatrix } = useMatrix();
  return canUseMatrix;
}
