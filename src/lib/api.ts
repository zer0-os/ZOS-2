import type { 
  LoginCredentials, 
  SignupCredentials, 
  AuthResponse, 
  SyncRequest, 
  SyncResponse,
  AuthError,
  User
} from '@/types/auth';
import { authConfig } from '@/config/auth';

// Base API configuration
const API_BASE_URL = authConfig.apiBaseUrl;

// In-memory token storage for later consumption
let currentAccessToken: string | null = null;

// Export function to get current token from memory
export const getCurrentAccessToken = (): string | null => {
  return currentAccessToken;
};

// Export function to set token in memory
export const setCurrentAccessToken = (token: string | null): void => {
  currentAccessToken = token;
};

class ApiError extends Error {
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

// Helper function to make API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; ZOS-App)',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
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

// Helper function to extract access token from login response
function extractAccessToken(response: AuthResponse): string | null {
  // Check all possible token fields in the response
  const possibleTokenFields = [
    'accessToken',
    'access_token', 
    'ssToken',
    'sessionToken',
    'zos_access_token',
    'token' // Also check the main token field
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

// Auth API functions
export const authApi = {
  // Login user using Zero.tech endpoint
  login: async (credentials: LoginCredentials): Promise<AuthResponse & { extractedAccessToken?: string }> => {
    const response = await apiRequest<AuthResponse>(authConfig.endpoints.login, {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    // Extract the access token from response
    const extractedAccessToken = extractAccessToken(response);
    
    // Store token in memory for later consumption
    if (extractedAccessToken) {
      setCurrentAccessToken(extractedAccessToken);
    } else {
      setCurrentAccessToken(null);
    }
    
    // Return the response with the extracted token
    return {
      ...response,
      extractedAccessToken: extractedAccessToken || undefined
    };
  },

  // Sign up new user
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/accounts/signup', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Sync user data
  sync: async (data: SyncRequest = {}): Promise<SyncResponse> => {
    return apiRequest<SyncResponse>('/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get current user profile using access token
  getProfile: async (accessToken: string): Promise<User> => {
    if (!accessToken) {
      throw new ApiError(400, 'MISSING_TOKEN', 'Access token is required for profile request');
    }

    // Try both Cookie and Authorization headers since browser may block Cookie header
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:141.0) Gecko/20100101 Firefox/141.0',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'X-APP-PLATFORM': 'zos',
      'Origin': 'https://zos.zero.tech',
      'Sec-GPC': '1',
      'Connection': 'keep-alive',
      'Referer': 'https://zos.zero.tech/',
      'Cookie': `zos_access_token=${accessToken}`,
      'Authorization': `Bearer ${accessToken}`, // Try Authorization header as backup
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'TE': 'trailers'
    };
    
    const response = await fetch('https://zosapi.zero.tech/api/users/current', {
      method: 'GET',
      headers,
      mode: 'cors',
      credentials: 'include', // Include cookies in the request
      cache: 'no-cache'
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          code: 'PROFILE_FETCH_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      
      throw new ApiError(
        response.status,
        errorData.code || 'PROFILE_FETCH_ERROR',
        errorData.message || 'Failed to fetch user profile',
        errorData.details
      );
    }
    
    const userData = await response.json();
    return userData;
  },

  // Get user by ZID (Zero ID)
  getUserByZid: async (zid: string) => {
    return apiRequest(`/users/zids/${zid}`);
  },

  // Logout (if backend requires cleanup)
  logout: async (): Promise<void> => {
    // Clear token from memory on logout
    setCurrentAccessToken(null);
    
    return apiRequest('/accounts/logout', {
      method: 'POST',
    });
  },

  // Refresh token
  refreshToken: async (): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/accounts/refresh', {
      method: 'POST',
    });
  },

  // Verify token
  verifyToken: async (): Promise<{ valid: boolean }> => {
    return apiRequest('/accounts/verify');
  },
};

export { ApiError };