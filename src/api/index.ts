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
export { ApiClient, ApiError, apiClient } from './client';

// Import services first
import { authService } from './services/auth';
import { userService } from './services/user';
import { matrixService } from './services/matrix';

// Export services
export { AuthService, authService } from './services/auth';
export { UserService, userService } from './services/user';
export { MatrixService, matrixService } from './services/matrix';

// Legacy compatibility exports (for gradual migration)
export { authService as authApi } from './services/auth';

// Legacy token management functions
export const getCurrentAccessToken = () => authService.getCurrentToken();
export const setCurrentAccessToken = (token: string | null) => authService.setCurrentToken(token);

/**
 * Convenience API object for easy access to all services
 */
export const api = {
  auth: authService,
  user: userService,
  matrix: matrixService,
} as const;

/**
 * Type definitions for API responses
 */
export type ApiServices = typeof api;
