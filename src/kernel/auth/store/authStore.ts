import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthState } from '@/kernel/auth/types/auth';

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User, token: string, accessToken?: string) => void;
  logout: () => void;
  clearError: () => void;
  updateUser: (userUpdates: Partial<User>) => void;
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

      updateUser: (userUpdates: Partial<User>) => set((state) => ({
        user: state.user ? { ...state.user, ...userUpdates } : null
      })),

      // Async actions - proper Zustand pattern
      loginAsync: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          // Import services here to avoid circular dependency
          const { authService: authApi, userService } = await import('@/network');
          const response = await authApi.login(credentials);
          // Update state with initial user data from login response
          set({
            user: response.user,
            isAuthenticated: true,
            error: null,
            isLoading: false,
          });
          
          // Fetch complete user profile using the access token
          if (response.accessToken) {
            try {
              const userData = await userService.getProfile(response.accessToken);
              
              set({
                user: userData,
                isAuthenticated: true,
                error: null,
                isLoading: false,
              });
            } catch (profileError) {
              // Use the user data from login response as fallback
              set({
                user: response.user,
                isAuthenticated: true,
                error: null,
                isLoading: false,
              });
            }
          }
          
        } catch (error: any) {
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
          const { authService: authApi } = await import('@/network');
          
          try {
            await authApi.logout(); // This will clear the auth token from memory
          } catch (error) {
            // Even if backend logout fails, we still want to clear local state
            // Clear token from memory manually if API call failed
            authApi.setCurrentToken(null);
          }
          

          
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
