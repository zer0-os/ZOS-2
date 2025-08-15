/**
 * API Layer - Centralized API management
 * 
 * This module provides a clean, organized API layer with:
 * - Separation of concerns (auth, user, etc.)
 * - Consistent error handling
 * - Type safety
 * - Easy testing and mocking
 * - Scalable structure
 */

// Export base client and error handling
export { ApiClient, ApiError, apiClient } from './http-client';

// Import services first
import { authService } from '../adapters/auth';
import { userService } from '../adapters/user';
import { matrixTokenService } from '../adapters/matrix';

// Export services
export { AuthService, authService } from '../adapters/auth';
export { UserService, userService } from '../adapters/user';
export { MatrixTokenService, matrixTokenService } from '../adapters/matrix';

// Legacy compatibility exports (for gradual migration)
export { authService as authApi } from '../adapters/auth';
export { matrixTokenService as matrixService } from '../adapters/matrix';

// Legacy token management functions
export const getCurrentAccessToken = () => authService.getCurrentToken();
export const setCurrentAccessToken = (token: string | null) => authService.setCurrentToken(token);

/**
 * Convenience API object for easy access to all services
 */
export const api = {
  auth: authService,
  user: userService,
  matrix: matrixTokenService,
} as const;

/**
 * Type definitions for API responses
 */
export type ApiServices = typeof api;
