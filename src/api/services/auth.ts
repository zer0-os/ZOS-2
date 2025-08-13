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

  /**
   * Extract access token from auth response
   */
  extractTokenFromResponse(response: AuthResponse): string | null {
    const possibleTokenFields = [
      'accessToken',
      'access_token', 
      'ssToken',
      'sessionToken',
      'zos_access_token',
      'token'
    ];

    for (const field of possibleTokenFields) {
      const tokenField = (response as any)[field];
      
      // Check if token field has a .value property
      if (tokenField && typeof tokenField === 'object' && tokenField.value) {
        const tokenValue = tokenField.value;
        if (typeof tokenValue === 'string' && tokenValue.length > 50) {
          return tokenValue;
        }
      }
      
      // Also check if the field itself is a string token (fallback)
      if (tokenField && typeof tokenField === 'string' && tokenField.length > 50) {
        return tokenField;
      }
    }

    return null;
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
  async login(credentials: LoginCredentials): Promise<AuthResponse & { extractedAccessToken?: string }> {
    const response = await apiClient.post<AuthResponse>(
      authConfig.endpoints.login,
      {
        email: credentials.email,
        password: credentials.password,
      }
    );

    // Extract and store the access token
    const extractedAccessToken = this.tokenManager.extractTokenFromResponse(response);
    
    if (extractedAccessToken) {
      this.tokenManager.setToken(extractedAccessToken);
    } else {
      this.tokenManager.clearToken();
    }
    
    return {
      ...response,
      extractedAccessToken: extractedAccessToken || undefined
    };
  }

  /**
   * Sign up new user
   */
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(authConfig.endpoints.signup, credentials);
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

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(authConfig.endpoints.refresh);
  }

  /**
   * Verify current token
   */
  async verifyToken(): Promise<{ valid: boolean }> {
    return apiClient.get(authConfig.endpoints.verify);
  }

  /**
   * Sync user data
   */
  async sync(data: SyncRequest = {}): Promise<SyncResponse> {
    return apiClient.post<SyncResponse>(authConfig.endpoints.sync, data);
  }
}

// Export singleton instance
export const authService = new AuthService();
