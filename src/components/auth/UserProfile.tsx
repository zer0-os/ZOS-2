import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth, useLogout } from '@/hooks/useAuth';
import { LogOut, User, Settings } from 'lucide-react';

interface UserProfileProps {
  className?: string;
  onMouseEnter?: () => void;
  isExpanded?: boolean;
  user?: any;
  variant?: 'topbar' | 'sidebar';
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  className = '', 
  onMouseEnter,
  isExpanded,
  user: propUser,
  variant = 'topbar'
}) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const logoutMutation = useLogout();
  
  // Use prop user or auth user
  const user = propUser || authUser;

  // Always show if authenticated, regardless of user object completeness
  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Logout error:', error);
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
    
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className="relative group h-10">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 transition-colors duration-200 ${className}`}
              onMouseEnter={onMouseEnter}
            >
              <Avatar className="h-8 w-8">
                {user?.profileSummary?.profileImage || user?.avatar ? (
                  <img src={user?.profileSummary?.profileImage || user?.avatar} alt={displayName} />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-primary text-primary-foreground text-sm font-medium">
                    {initials}
                  </div>
                )}
              </Avatar>
              {/* Online status indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
            </Button>
          </PopoverTrigger>
          
          <PopoverContent 
            className="p-0" 
            align="start" 
            side="top"
            sideOffset={8}
            style={{
              width: '256px', // Same as IndexPanel width (w-64 = 256px)
              marginLeft: '48px', // Offset to align with IndexPanel position
            }}
          >
            <Card className="border-0 shadow-none">
              <div className="p-4 border-b">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={displayName} />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-primary text-primary-foreground text-sm font-medium">
                        {initials}
                      </div>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.profileSummary?.primaryEmail || user?.handle || user?.email || 'No email'}
                    </p>
                    {user?.primaryZID && (
                      <p className="text-xs text-muted-foreground truncate">
                        {user.primaryZID}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-8 px-2 text-sm"
                  disabled
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start h-8 px-2 text-sm"
                  disabled
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>

                <div className="border-t my-2" />

                <Button
                  variant="ghost"
                  className="w-full justify-start h-8 px-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
                </Button>
              </div>
            </Card>
          </PopoverContent>
        </Popover>
        
        {/* Expanded text for sidebar */}
        <div
          className={`absolute left-16 top-0 h-10 flex items-center pointer-events-none transition-all duration-300 ${
            isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
          }`}
        >
          <div className="flex flex-col items-start pl-2">
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200 whitespace-nowrap">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {user?.primaryZID || user?.handle || user?.profileSummary?.primaryEmail || 'Online'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Topbar variant (original)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={`h-8 w-8 rounded-full p-0 ${className}`}
        >
          <Avatar className="h-8 w-8">
            {user?.profileSummary?.profileImage || user?.avatar ? (
              <img src={user?.profileSummary?.profileImage || user?.avatar} alt={displayName} />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-primary text-primary-foreground text-sm font-medium">
                {initials}
              </div>
            )}
          </Avatar>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-0" align="end">
        <Card className="border-0 shadow-none">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                {user?.avatar ? (
                  <img src={user.avatar} alt={displayName} />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-primary text-primary-foreground text-sm font-medium">
                    {initials}
                  </div>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.profileSummary?.primaryEmail || user?.handle || user?.email || 'No email'}
                </p>
                {user?.primaryZID && (
                  <p className="text-xs text-muted-foreground truncate">
                    {user.primaryZID}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 text-sm"
              disabled
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 text-sm"
              disabled
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>

            <div className="border-t my-2" />

            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
            </Button>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
