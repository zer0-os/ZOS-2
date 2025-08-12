import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, useLogout } from '@/hooks/useAuth';
import { LogOut, User } from 'lucide-react';

interface SimpleLogoutButtonProps {
  className?: string;
}

export const SimpleLogoutButton: React.FC<SimpleLogoutButtonProps> = ({ className = '' }) => {
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = useLogout();

  // Always show if authenticated, regardless of user object completeness
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Logout error:', error);
      // Logout should still work even if there's an error
    }
  };

  // Use Zero.tech user data structure
  const displayName = user?.profileSummary?.firstName 
    ? `${user.profileSummary.firstName} ${user.profileSummary.lastName || ''}`.trim()
    : user?.handle 
    ? user.handle.replace('@zero.tech', '')
    : user?.profileSummary?.primaryEmail 
    ? user.profileSummary.primaryEmail
    : user?.name || user?.username || user?.email || 'User';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-2 text-sm">
        <User className="h-4 w-4" />
        <span className="hidden sm:inline truncate max-w-32">
          {displayName}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
        className="h-8"
      >
        <LogOut className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">
          {logoutMutation.isPending ? 'Signing out...' : 'Logout'}
        </span>
      </Button>
    </div>
  );
};
