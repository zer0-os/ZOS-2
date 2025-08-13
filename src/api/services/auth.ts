import type { 
  LoginCredentials, 
  SignupCredentials, 
  AuthResponse, 
  SyncRequest, 
  SyncResponse 
} from '@/types/auth';
import { authConfig } from '@/config/auth';
import { apiClient } from '../client';

/**
 * Token management utilities
 */
class TokenManager {
  private currentAccessToken: string | null = null;

  getToken(): string | null {
    return this.currentAccessToken;
  }

  setToken(token: string | null): void {
    this.currentAccessToken = token;
  }

  clearToken(): void {
    this.currentAccessToken = null;
  }


}

/**
 * Authentication service
 */
export class AuthService {
  private tokenManager = new TokenManager();

  /**
   * Get current access token
   */
  getCurrentToken(): string | null {
    return this.tokenManager.getToken();
  }

  /**
   * Set current access token
   */
  setCurrentToken(token: string | null): void {
    this.tokenManager.setToken(token);
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      authConfig.endpoints.login,
      {
        email: credentials.email,
        password: credentials.password,
      }
    );

    // Store the access token
    if (response.accessToken) {
      this.tokenManager.setToken(response.accessToken);
    } else {
      this.tokenManager.clearToken();
    }
    
    return response;
  }


  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(authConfig.endpoints.logout);
    } finally {
      // Always clear token, even if logout request fails
      this.tokenManager.clearToken();
    }
  }

}

// Export singleton instance
export const authService = new AuthService();
