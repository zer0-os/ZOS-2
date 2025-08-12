// Authentication configuration
export const authConfig = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://zosapi.zero.tech/api/v2',
  
  // Development settings
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Token settings
  tokenKey: 'auth_token',
  
  // Query settings
  defaultStaleTime: 1000 * 60 * 5, // 5 minutes
  defaultCacheTime: 1000 * 60 * 10, // 10 minutes
  
  // Auto-verification settings (disabled to prevent startup errors)
  enableAutoTokenVerification: false,
  enableAutoProfileFetch: false,
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000,
  
  // Endpoints
  endpoints: {
    login: '/accounts/login',
    signup: '/accounts/signup',
    logout: '/accounts/logout',
    refresh: '/accounts/refresh',
    verify: '/accounts/verify',
    profile: '/users/profile',
    userByZid: (zid: string) => `/users/zids/${zid}`,
    sync: '/sync',
  },
} as const;
