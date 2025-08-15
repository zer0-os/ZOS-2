import React, { useState } from 'react';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { useAuth, useLogout } from '@/kernel/auth/useAuth';
import { LogOut, User, Palette } from 'lucide-react';
import { authConfig } from '@/kernel/auth/auth-config';

import { ProfileDetails } from './ProfileDetails';
import { ThemeSettings } from './theme-settings/ThemeSettings';

import placeholderAvatar from '@/os/desktop/assets/n3o-avatar.jpg';

interface SettingsProps {
  className?: string;
  onMouseEnter?: () => void;
  isExpanded?: boolean;
  user?: any;
  variant?: 'topbar' | 'sidebar';
}

export const Settings: React.FC<SettingsProps> = ({ 
  className = '', 
  onMouseEnter,
  user: propUser,
  variant = 'topbar'
}) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const logoutMutation = useLogout();
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  
  // Use prop user or auth user
  const user = propUser || authUser;

  // Always show if authenticated, regardless of user object completeness
  if (!isAuthenticated) return null;

  // Helper to get avatar image source with consistent fallback logic
  const getAvatarSrc = () => {
    const profileImage = user?.profileSummary?.profileImage || user?.avatar;
    
    // Handle Matrix mxc:// URLs by converting them to HTTP URLs
    if (profileImage && typeof profileImage === 'string' && profileImage.startsWith('mxc://')) {
      // Extract the server name and media ID from mxc://server/mediaId
      const mxcMatch = profileImage.match(/^mxc:\/\/([^\/]+)\/(.+)$/);
      if (mxcMatch) {
        const [, serverName, mediaId] = mxcMatch;
        // Use the actual Matrix homeserver URL instead of the server name from mxc://
        const homeserverUrl = authConfig.matrixHomeserverUrl;
        return `${homeserverUrl}/_matrix/media/r0/download/${serverName}/${mediaId}`;
      }
    }
    
    return profileImage || placeholderAvatar;
  };

  // Helper to get user initials for fallback
  const getInitials = () => {
    if (user?.profileSummary?.firstName) {
      const firstName = user.profileSummary.firstName;
      const lastName = user.profileSummary.lastName || '';
      return `${firstName[0]}${lastName[0] || ''}`.toUpperCase();
    }
    if (user?.handle) {
      return user.handle.substring(0, 2).toUpperCase();
    }
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

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
                <AvatarImage 
                  src={getAvatarSrc()} 
                  alt={displayName}
                  onError={(e) => {
                    // Gracefully handle failed media downloads by hiding the image
                    // This will fall back to the AvatarFallback component
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {/* Online status indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
            </Button>
          </PopoverTrigger>
          
          <PopoverContent 
            className="p-0 w-64" 
            align="start" 
            side="left"
            sideOffset={8}
            avoidCollisions={true}
            collisionPadding={16}
            style={{
              height: 'calc(100vh - 105px)',
              marginTop: '32px'
            }}
          >
            {showProfileDetail ? (
              <ProfileDetails user={user} onBack={() => setShowProfileDetail(false)} />
            ) : showThemePanel ? (
              <ThemeSettings onBack={() => setShowThemePanel(false)} />
            ) : (
              <Card className="border-0 shadow-none flex flex-col h-full overflow-y-auto">
                <div className="px-6 pt-16 pb-6 border-b">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-[107px] w-[107px]">
                      <AvatarImage 
                        src={getAvatarSrc()} 
                        alt={displayName}
                        onError={(e) => {
                          // Gracefully handle failed media downloads by hiding the image
                          // This will fall back to the AvatarFallback component
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center w-full">
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

                <div className="p-2 flex-1 flex flex-col justify-end">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-8 px-2 text-sm font-normal"
                    onClick={() => setShowProfileDetail(true)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-8 px-2 text-sm font-normal"
                    onClick={() => setShowThemePanel(true)}
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    Theme
                  </Button>

                  <div className="border-t my-2" />

                  <Button
                    variant="ghost"
                    className="w-full justify-start h-8 px-2 text-sm font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
                  </Button>
                </div>
              </Card>
            )}
          </PopoverContent>
        </Popover>
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
            <AvatarImage 
              src={getAvatarSrc()} 
              alt={displayName}
              onError={(e) => {
                // Gracefully handle failed media downloads by hiding the image
                // This will fall back to the AvatarFallback component
                e.currentTarget.style.display = 'none';
              }}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-0" align="end">
        {showProfileDetail ? (
          <ProfileDetails user={user} onBack={() => setShowProfileDetail(false)} />
        ) : showThemePanel ? (
          <ThemeSettings onBack={() => setShowThemePanel(false)} />
        ) : (
          <Card className="border-0 shadow-none">
            <div className="px-6 pt-16 pb-6 border-b">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-[107px] w-[107px]">
                  <AvatarImage 
                    src={getAvatarSrc()} 
                    alt={displayName}
                    onError={(e) => {
                      // Gracefully handle failed media downloads by hiding the image
                      // This will fall back to the AvatarFallback component
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center w-full">
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
                className="w-full justify-start h-8 px-2 text-sm font-normal"
                onClick={() => setShowProfileDetail(true)}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-8 px-2 text-sm font-normal"
                onClick={() => setShowThemePanel(true)}
              >
                <Palette className="mr-2 h-4 w-4" />
                Theme
              </Button>


              <div className="border-t my-2" />

              <Button
                variant="ghost"
                className="w-full justify-start h-8 px-2 text-sm font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
              </Button>
            </div>
          </Card>
        )}
      </PopoverContent>
    </Popover>
  );
};
