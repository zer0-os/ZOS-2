import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types/auth';

interface DevAuthToggleProps {
  className?: string;
}

export const DevAuthToggle: React.FC<DevAuthToggleProps> = ({ className = '' }) => {
  const { login, logout, isAuthenticated, user } = useAuth();

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const handleDevLogin = () => {
    const mockUser: User = {
      id: 'dev-user-123',
      email: 'dev@zero.tech',
      username: 'devuser',
      name: 'Dev User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const mockToken = 'dev-token-123';
    login(mockUser, mockToken);
  };

  const handleDevLogout = () => {
    logout();
  };

  return (
    <Card className={`p-4 border-dashed border-warning ${className}`}>
      <div className="text-center space-y-4">
        <div className="text-sm text-warning font-medium">
          🚧 Development Mode
        </div>
        
        {!isAuthenticated ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Skip API calls and login with mock data
            </p>
            <Button 
              onClick={handleDevLogin}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Dev Login (Skip API)
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Logged in as: {user?.email}
            </p>
            <Button 
              onClick={handleDevLogout}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Dev Logout
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
