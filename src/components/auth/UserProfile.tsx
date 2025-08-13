import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useAuth, useLogout } from '@/hooks/useAuth';
import { LogOut, User, Palette, ArrowLeft } from 'lucide-react';
import { CompactThemePicker } from '@/components/ThemePicker';
import { CompactBackgroundPicker } from '@/components/BackgroundPicker';
import { ThemeToggle } from '@/components/ThemeSwitcher';
import { useThemeContext } from '@/contexts/ThemeProvider';
import { THEME_VARIANTS, THEMES } from '@/lib/theme';
import placeholderAvatar from '@/assets/n3o-avatar.jpg';

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
  user: propUser,
  variant = 'topbar'
}) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const logoutMutation = useLogout();
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const { theme, themeVariant } = useThemeContext();
  
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
        // Convert to HTTP URL using Matrix media repository format
        return `https://${serverName}/_matrix/media/r0/download/${serverName}/${mediaId}`;
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

  // Profile detail panel component
  const ProfileDetailPanel = () => (
    <Card className="border-0 shadow-none flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowProfileDetail(false)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-medium">Profile Details</h3>
      </div>
      
      <div className="p-6 flex-1">
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <p className="text-sm mt-1">{displayName}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-sm mt-1">{user?.profileSummary?.primaryEmail || user?.handle || user?.email || 'No email'}</p>
          </div>
          
          {user?.primaryZID && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">ZID</label>
              <p className="text-sm mt-1">{user.primaryZID}</p>
            </div>
          )}
          
          {user?.profileId && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Profile ID</label>
              <p className="text-sm mt-1">{user.profileId}</p>
            </div>
          )}
          
          {user?.matrixId && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Matrix ID</label>
              <p className="text-sm mt-1">{user.matrixId}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  // Theme settings panel component
  const ThemeSettingsPanel = () => {
    const currentTheme = THEME_VARIANTS[themeVariant];
    
    return (
      <Card className="border-0 shadow-none flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowThemePanel(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium">Theme Settings</h3>
        </div>
        
        <div className="p-6 flex-1 space-y-6">
          {/* Theme Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Theme Mode</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm">{THEMES[theme].name}</p>
                <p className="text-xs text-muted-foreground">
                  {THEMES[theme].description}
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <Separator />

          {/* Theme Colors Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Theme Colors</span>
            </div>

            {/* Current Theme Display */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-border/50">
              <div 
                className="w-6 h-6 rounded-full border border-card-foreground/20"
                style={{ backgroundColor: `hsl(${currentTheme.color})` }}
              />
              <div>
                <p className="text-sm font-medium">{currentTheme.name}</p>
                <p className="text-xs text-muted-foreground">{currentTheme.description}</p>
              </div>
            </div>

            {/* Color Picker */}
            <CompactThemePicker />
          </div>

          <Separator />

          {/* Background Picker */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Background</span>
            </div>
            <CompactBackgroundPicker />
          </div>
        </div>
      </Card>
    );
  };

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
                <AvatarImage src={getAvatarSrc()} alt={displayName} />
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
              <ProfileDetailPanel />
            ) : showThemePanel ? (
              <ThemeSettingsPanel />
            ) : (
              <Card className="border-0 shadow-none flex flex-col h-full overflow-y-auto">
                <div className="px-6 pt-16 pb-6 border-b">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-[107px] w-[107px]">
                      <AvatarImage src={getAvatarSrc()} alt={displayName} />
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
                    className="w-full justify-start h-8 px-2 text-sm"
                    onClick={() => setShowProfileDetail(true)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-8 px-2 text-sm"
                    onClick={() => setShowThemePanel(true)}
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    Theme
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
            <AvatarImage src={getAvatarSrc()} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-0" align="end">
        {showProfileDetail ? (
          <ProfileDetailPanel />
        ) : showThemePanel ? (
          <ThemeSettingsPanel />
        ) : (
          <Card className="border-0 shadow-none">
            <div className="px-6 pt-16 pb-6 border-b">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-[107px] w-[107px]">
                  <AvatarImage src={getAvatarSrc()} alt={displayName} />
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
                className="w-full justify-start h-8 px-2 text-sm"
                onClick={() => setShowProfileDetail(true)}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-8 px-2 text-sm"
                onClick={() => setShowThemePanel(true)}
              >
                <Palette className="mr-2 h-4 w-4" />
                Theme
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
        )}
      </PopoverContent>
    </Popover>
  );
};
