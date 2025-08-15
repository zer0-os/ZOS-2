import type { 
  LoginCredentials, 
  SignupCredentials, 
  AuthResponse, 
  SyncRequest, 
  SyncResponse 
} from '@/kernel/auth/types/auth';
import { authConfig } from '@/kernel/auth/auth-config';
import { apiClient } from '../api/http-client';

/**
 * Token management utilities
 */
class TokenManager {
  private currentAccessToken: string | null = null;

  getToken(): string | null {
    // First try memory, then fall back to localStorage
    if (this.currentAccessToken) {
      return this.currentAccessToken;
    }
    
    // Fallback to localStorage if token not in memory
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      this.currentAccessToken = storedToken; // Cache it in memory
      return storedToken;
    }
    
    return null;
  }

  setToken(token: string | null): void {
    this.currentAccessToken = token;
    // Also sync with localStorage for persistence
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  clearToken(): void {
    this.currentAccessToken = null;
    localStorage.removeItem('access_token');
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
      const token = this.getCurrentToken();
      await apiClient.post(authConfig.endpoints.logout, undefined, token);
    } finally {
      // Always clear token, even if logout request fails
      this.tokenManager.clearToken();
    }
  }

}

// Export singleton instance
export const authService = new AuthService();
