import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authService as authApi, ApiError } from '@/api';
import type { SignupCredentials, SyncRequest } from '@/types/auth';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  verify: () => [...authKeys.all, 'verify'] as const,
} as const;

// Main auth hook
export const useAuth = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    login: storeLogin, 
    logout: storeLogout, 
    loginAsync,
    logoutAsync,
    setError, 
    setLoading, 
    clearError 
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    setError,
    setLoading,
    clearError,
    login: storeLogin,
    logout: storeLogout,
    loginAsync,
    logoutAsync,
  };
};

// Simplified login hook - uses Zustand async action
export const useLogin = () => {
  const { loginAsync, isLoading } = useAuth();
  
  return {
    mutateAsync: loginAsync,
    isPending: isLoading, // Use Zustand's loading state
  };
};

// Signup mutation
export const useSignup = () => {
  const { login, setError, clearError, setLoading } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      clearError();
      setLoading(true);
      try {
        const result = await authApi.signup(credentials);
        return result;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error: ApiError) => {
      setError(error.message || 'Signup failed');
      setLoading(false); // Ensure loading is false on error
    },
  });
};

// Sync mutation (based on your backend endpoint)
export const useSync = () => {
  const { setError, clearError } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SyncRequest = {}) => {
      clearError();
      return authApi.sync(data);
    },
    onSuccess: () => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error: ApiError) => {
      setError(error.message || 'Sync failed');
    },
  });
};

// Simplified logout hook - uses Zustand async action
export const useLogout = () => {
  const { logoutAsync, isLoading } = useAuth();
  
  return {
    mutateAsync: logoutAsync,
    isPending: isLoading, // Use Zustand's loading state
  };
};

