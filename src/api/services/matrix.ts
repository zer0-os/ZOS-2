import type { MatrixSSOTokenResponse, MatrixConfig } from '@/types/auth';
import { apiClient, ApiError } from '../client';

/**
 * Matrix service for handling Matrix-specific operations via Zero API
 */
export class MatrixService {
  private matrixAccessToken: string | null = null;

  /**
   * Get current Matrix access token from memory
   */
  getCurrentMatrixToken(): string | null {
    return this.matrixAccessToken;
  }

  /**
   * Set Matrix access token in memory
   */
  setCurrentMatrixToken(token: string | null): void {
    this.matrixAccessToken = token;
  }

  /**
   * Clear Matrix access token from memory
   */
  clearMatrixToken(): void {
    this.matrixAccessToken = null;
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

    try {
      const baseUrl = 'https://zosapi.zero.tech';
      const endpoint = `${baseUrl}/accounts/ssoToken`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${zeroAccessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:141.0) Gecko/20100101 Firefox/141.0',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'X-APP-PLATFORM': 'zos',
          'Origin': 'https://zos.zero.tech',
          'Referer': 'https://zos.zero.tech/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
        },
        mode: 'cors',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new ApiError(
          response.status,
          'MATRIX_SSO_ERROR',
          `Matrix SSO request failed: ${response.status} ${response.statusText}`
        );
      }

      const data: MatrixSSOTokenResponse = await response.json();

      // Store the Matrix token in memory for the session
      if (data.token) {
        this.setCurrentMatrixToken(data.token);
        console.log('✅ Matrix token obtained:', data.token.slice(0, 25) + '...');
      }

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
   * Initialize Matrix client configuration
   * This prepares the configuration object needed for Matrix client initialization
   * 
   * @param homeserverUrl - Optional Matrix homeserver URL (defaults to Zero's Matrix server)
   * @returns MatrixConfig object for Matrix client initialization
   */
  getMatrixConfig(homeserverUrl?: string): MatrixConfig {
    return {
      homeserverUrl: homeserverUrl || 'https://matrix.zero.tech',
      accessToken: this.matrixAccessToken || undefined,
      userId: undefined, // Will be set by Matrix client after initialization
    };
  }

  /**
   * Check if Matrix token is available
   */
  hasMatrixToken(): boolean {
    return !!this.matrixAccessToken;
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
