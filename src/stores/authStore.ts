import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthState } from '@/types/auth';

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, token: string, accessToken?: string) => void;
  logout: () => void;
  clearError: () => void;
  // Async actions
  loginAsync: (credentials: { email: string; password: string }) => Promise<void>;
  logoutAsync: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      login: (user, token, accessToken) => {
        // Store both tokens in localStorage synchronously
        localStorage.setItem('auth_token', token);
        if (accessToken) {
          localStorage.setItem('access_token', accessToken);
        }
        
        set({
          user,
          isAuthenticated: true,
          error: null,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });
      },

      clearError: () => set({ error: null }),

      // Async actions - proper Zustand pattern
      loginAsync: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          // Import services here to avoid circular dependency
          const { authService: authApi, userService, matrixService } = await import('@/api');
          
          const response = await authApi.login(credentials);
          
          if (response.extractedAccessToken) {
            console.log('✅ ZOS token obtained:', response.extractedAccessToken.slice(0, 25) + '...');
          }
          
          // Update state with initial user data from login response
          set({
            user: response.user,
            isAuthenticated: true,
            error: null,
            isLoading: false,
          });
          
          // Fetch complete user profile and Matrix SSO token using the extracted access token
          if (response.extractedAccessToken) {
            try {
              // Fetch user profile and Matrix SSO token in parallel for better performance
              const [currentUser, matrixSSOResponse] = await Promise.allSettled([
                userService.getProfile(response.extractedAccessToken),
                matrixService.getSSOToken(response.extractedAccessToken)
              ]);

              // Handle user profile result
              let userData = response.user; // fallback to login response user data
              if (currentUser.status === 'fulfilled') {
                userData = currentUser.value;
                console.log('✅ ZERO profile response successful');
              }

              // Handle Matrix SSO token result
              let matrixToken: string | undefined;
              if (matrixSSOResponse.status === 'fulfilled') {
                matrixToken = matrixSSOResponse.value.token;
              }
              
              // Combine user data with Matrix token
              const userWithMatrix = {
                ...userData,
                ...(matrixToken && { matrixAccessToken: matrixToken })
              };
              
              set({
                user: userWithMatrix,
                isAuthenticated: true,
                error: null,
                isLoading: false,
              });
              
            } catch (error) {
              console.error('Failed to complete login process:', error);
              // Continue with basic login data - don't fail the entire login
              set({
                user: response.user,
                isAuthenticated: true,
                error: null,
                isLoading: false,
              });
            }
          }
          
        } catch (error: any) {
          console.error('Login failed:', error);
          set({
            error: error.message || 'Login failed',
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw error; // Re-throw so UI can handle it
        }
      },

      logoutAsync: async () => {
        set({ isLoading: true });
        
        try {
          // Import services here to avoid circular dependency
          const { authService: authApi, matrixService } = await import('@/api');
          
          try {
            await authApi.logout(); // This will clear the auth token from memory
          } catch (error) {
            // Even if backend logout fails, we still want to clear local state
            console.warn('Backend logout failed:', error);
            // Clear token from memory manually if API call failed
            authApi.setCurrentToken(null);
          }
          
          // Always clear Matrix token on logout
          matrixService.clearMatrixToken();
          
          // Clear state (no localStorage involved)
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            isLoading: false,
          });
          
        } catch (error: any) {
          // For logout, we still clear local state even on error
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            isLoading: false,
          });
          
          console.error('Logout error:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // No token storage/rehydration - tokens are ephemeral
    }
  )
);

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const { user, isAuthenticated } = useAuthStore.getState();
  return isAuthenticated && !!user;
};
