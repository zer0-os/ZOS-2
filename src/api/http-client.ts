import { authConfig } from '@/kernel/auth/auth-config';
import type { AuthError } from '@/kernel/auth/types/auth';

/**
 * Custom API Error class for better error handling
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, any>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Base API client with common configuration and error handling
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || authConfig.apiBaseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; ZOS-App)',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
    };
  }

  /**
   * Make an authenticated API request with token
   */
  async request<T>(
    endpoint: string,
    options: RequestInit & { token?: string } = {}
  ): Promise<T> {
    const { token, ...requestOptions } = options;
    
    const config: RequestInit = {
      headers: {
        ...this.defaultHeaders,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...requestOptions.headers,
      },
      ...requestOptions,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    if (!response.ok) {
      let errorData: AuthError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          code: 'NETWORK_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      
      throw new ApiError(
        response.status,
        errorData.code,
        errorData.message,
        errorData.details
      );
    }
    
    return response.json();
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', token });
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      token,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      token,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', token });
  }

  /**
   * Update base URL (useful for environment switching)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Update default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();
