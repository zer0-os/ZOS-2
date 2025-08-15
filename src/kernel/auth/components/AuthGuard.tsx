import React from 'react';
import { useAuth } from '@/kernel/auth/useAuth';
import { LoginForm } from './LoginForm';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Don't automatically verify token to avoid 500 errors on startup
  // Token verification will happen when user tries to login
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        {fallback || <LoginForm />}
      </div>
    );
  }

  // Show protected content
  return <>{children}</>;
};
