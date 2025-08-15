/**
 * ServicesProvider - Supplies bound ports via React context
 * Keeps React separate from transport, uses service registry pattern
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/kernel/auth/store/authStore';
import { authService } from '@/network';
import { matrixSessionBinder, type MatrixSession } from '@/services/matrix';
import type { ChatPort } from '@/kernel/ports/chat';

interface ServicesContextType {
  chat: ChatPort | null;
  isReady: boolean;
  error: string | null;
}

const ServicesContext = createContext<ServicesContextType>({
  chat: null,
  isReady: false,
  error: null,
});

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [services, setServices] = useState<ServicesContextType>({
    chat: null,
    isReady: false,
    error: null,
  });

  useEffect(() => {
    // Subscribe to Matrix session changes
    const unsubscribe = matrixSessionBinder.onSessionChange((session: MatrixSession | null) => {
      if (session) {
        setServices({
          chat: session.chatPort,
          isReady: session.isReady,
          error: session.error,
        });
      } else {
        setServices({
          chat: null,
          isReady: false,
          error: null,
        });
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Handle auth state changes
    const zosAccessToken = authService.getCurrentToken();
    
    if (isAuthenticated && user && zosAccessToken) {
      // Create Matrix session when user is authenticated
      matrixSessionBinder.handleAuthChange(user, zosAccessToken).catch((error) => {
        console.error('Failed to handle auth change in ServicesProvider:', error);
      });
    } else {
      // Destroy session when user logs out
      matrixSessionBinder.handleAuthChange(null, null).catch((error) => {
        console.error('Failed to handle auth logout in ServicesProvider:', error);
      });
    }
  }, [isAuthenticated, user]);

  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices(): ServicesContextType {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}

export function useChatPort(): ChatPort | null {
  const { chat } = useServices();
  return chat;
}
