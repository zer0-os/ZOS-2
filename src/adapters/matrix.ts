import type { MatrixSSOTokenResponse, MatrixConfig } from '@/kernel/auth/types/auth';
import { ApiError } from '../api/http-client';

/**
 * Matrix service for handling Matrix-specific operations via Zero API
 */
export class MatrixService {
  private matrixAccessToken: string | null = null;
  private matrixUserId: string | null = null;
  private lastZeroToken: string | null = null; // Track the ZOS token used to get Matrix token

  /**
   * Get current Matrix access token from memory
   */
  getCurrentMatrixToken(): string | null {
    return this.matrixAccessToken;
  }

  /**
   * Get current Matrix user ID from memory
   */
  getCurrentMatrixUserId(): string | null {
    return this.matrixUserId;
  }

  /**
   * Set Matrix access token in memory
   */
  setCurrentMatrixToken(token: string | null): void {
    this.matrixAccessToken = token;
  }

  /**
   * Set Matrix user ID in memory
   */
  setCurrentMatrixUserId(userId: string | null): void {
    this.matrixUserId = userId;
  }

  /**
   * Clear Matrix access token and user ID from memory
   */
  clearMatrixToken(): void {
    this.matrixAccessToken = null;
    this.matrixUserId = null;
    this.lastZeroToken = null;
  }

  /**
   * Get Matrix SSO token using Zero access token
   * This token is required for Matrix operations and is different from the Zero access token
   * 
   * @param zeroAccessToken - The Zero.tech access token obtained from login
   * @returns Promise<MatrixSSOTokenResponse> - Contains the Matrix-specific SSO token
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
      
      // Check if server is returning unexpected format
      if (Array.isArray(data)) {
        throw new ApiError(
          500,
          'UNEXPECTED_RESPONSE_FORMAT',
          `Matrix SSO endpoint returned array instead of object: ${JSON.stringify(data)}`
        );
      }

      // Validate token format
      if (!data || !data.token || typeof data.token !== 'string') {
        throw new ApiError(
          500,
          'INVALID_TOKEN_FORMAT',
          `Matrix SSO response missing or invalid token: ${JSON.stringify(data)}`,
          { responseData: data }
        );
      }

      // Store the Matrix token and associated ZOS token in memory for the session
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

  /**
   * Set Matrix user ID from Zero profile data
   * The Matrix user ID is provided in the Zero profile response as matrixId
   * 
   * @param matrixId - The Matrix user ID from Zero profile (e.g., "@user:matrix.zero.tech")
   */
  setMatrixUserIdFromProfile(matrixId: string | undefined): void {
    if (matrixId) {
      this.setCurrentMatrixUserId(matrixId);
    }
  }

  /**
   * Test Matrix connection by fetching basic account info
   * This is a simple way to verify the Matrix token and connection are working
   * 
   * @returns Promise with basic Matrix account information
   */
  async testMatrixConnection(): Promise<{
    success: boolean;
    userId?: string;
    displayName?: string;
    avatarUrl?: string;
    homeserver?: string;
    error?: string;
  }> {
    if (!this.matrixAccessToken) {
      return {
        success: false,
        error: 'No Matrix access token available'
      };
    }

    try {
      const homeserverUrl = 'https://zos-home-2-e24b9412096f.herokuapp.com';
      
      // Test 1: Get current user info (whoami)
      const whoamiResponse = await fetch(`${homeserverUrl}/_matrix/client/v3/account/whoami`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.matrixAccessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!whoamiResponse.ok) {
        throw new Error(`Whoami request failed: ${whoamiResponse.status} ${whoamiResponse.statusText}`);
      }

      const whoamiData = await whoamiResponse.json();
      
      // Test 2: Get display name (optional, might fail if not set)
      let displayName: string | undefined;
      try {
        const profileResponse = await fetch(`${homeserverUrl}/_matrix/client/v3/profile/${whoamiData.user_id}/displayname`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.matrixAccessToken}`,
            'Accept': 'application/json',
          },
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          displayName = profileData.displayname;
        }
      } catch (profileError) {
        // Display name fetch failed, continue without it
      }

      // Test 3: Get avatar URL (optional, might fail if not set)
      let avatarUrl: string | undefined;
      try {
        const avatarResponse = await fetch(`${homeserverUrl}/_matrix/client/v3/profile/${whoamiData.user_id}/avatar_url`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.matrixAccessToken}`,
            'Accept': 'application/json',
          },
        });
        
        if (avatarResponse.ok) {
          const avatarData = await avatarResponse.json();
          avatarUrl = avatarData.avatar_url;
        }
      } catch (avatarError) {
        // Avatar URL fetch failed, continue without it
      }
      
      return {
        success: true,
        userId: whoamiData.user_id,
        displayName,
        avatarUrl,
        homeserver: homeserverUrl,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Initialize Matrix client configuration
   * This prepares the configuration object needed for Matrix client initialization
   * 
   * @param homeserverUrl - Optional Matrix homeserver URL (defaults to Zero's Matrix server)
   * @returns MatrixConfig object for Matrix client initialization
   */
  getMatrixConfig(homeserverUrl?: string): MatrixConfig {
    return {
      homeserverUrl: homeserverUrl || 'https://zos-home-2-e24b9412096f.herokuapp.com',
      accessToken: this.matrixAccessToken || undefined,
      userId: this.matrixUserId || undefined,
    };
  }

  /**
   * Check if Matrix token is available
   */
  hasMatrixToken(): boolean {
    return !!this.matrixAccessToken;
  }

  /**
   * Check if we have a valid Matrix token for the current ZOS token
   */
  hasValidMatrixTokenFor(zeroAccessToken: string): boolean {
    return !!(this.matrixAccessToken && this.lastZeroToken === zeroAccessToken);
  }

  /**
   * Validate Matrix token format (basic validation)
   */
  isValidMatrixToken(token?: string): boolean {
    const tokenToCheck = token || this.matrixAccessToken;
    return !!(tokenToCheck && typeof tokenToCheck === 'string' && tokenToCheck.length > 10);
  }

  /**
   * Get Matrix user ID from stored token (if available)
   * Note: This is a placeholder - actual Matrix user ID extraction would depend on token format
   */
  getMatrixUserId(): string | null {
    // This would need to be implemented based on how Matrix tokens encode user information
    // For now, return null as we'd need Matrix client to determine the user ID
    return null;
  }
}

// Export singleton instance
export const matrixService = new MatrixService();