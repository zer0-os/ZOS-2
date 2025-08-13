import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, MessageCircle, Wallet, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeSwitcher';
import { SidebarItem } from '@/components/SidebarItem';
import { UserProfile } from '@/components/auth/UserProfile';
import { useAuth } from '@/hooks/useAuth';

import n3oAvatar from '@/assets/n3o-avatar.jpg';


interface SidebarProps {
  className?: string;
  onOpenApp?: (appId: string) => void;
  selectedApp?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  onOpenApp,
  selectedApp
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const handleAppClick = (appId: string) => {
    onOpenApp?.(appId);
  };

  return (
    <Card 
      className={`border-0 text-card-foreground fixed left-0 top-8 h-[calc(100vh-2rem)] flex flex-col py-4 bg-transparent backdrop-blur-0 shadow-none rounded-none transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-16'
      } ${className}`}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Navigation Icons - Vertically Centered */}
      <div className="flex-1 flex flex-col justify-center space-y-2">
        <SidebarItem
          icon={MessageCircle}
          label="Chat"
          onClick={() => handleAppClick('chat')}
          onMouseEnter={() => setIsExpanded(true)}
          isExpanded={isExpanded}
          className={selectedApp === 'chat' ? 'sidebar-item-selected' : ''}
        />

        <SidebarItem
          icon={Home}
          label="Feed"
          onClick={() => handleAppClick('feed')}
          onMouseEnter={() => setIsExpanded(true)}
          isExpanded={isExpanded}
          className={selectedApp === 'feed' ? 'sidebar-item-selected' : ''}
        />

        <SidebarItem
          icon={Wallet}
          label="Wallet"
          onClick={() => handleAppClick('wallet')}
          onMouseEnter={() => setIsExpanded(true)}
          isExpanded={isExpanded}
          className={selectedApp === 'wallet' ? 'sidebar-item-selected' : ''}
        />
      </div>

      {/* Settings and Theme Switcher */}
      <div className="mt-auto space-y-2 mb-4">
        {/* Theme Toggle */}
        <SidebarItem
          onMouseEnter={() => setIsExpanded(true)}
          isExpanded={isExpanded}
          customContent={
            <div className="absolute left-3 h-10 w-10 flex items-center justify-center">
              <ThemeToggle />
            </div>
          }
        />

        {/* Settings Button (disabled popup) */}
        <SidebarItem
          icon={Settings}
          onMouseEnter={() => setIsExpanded(true)}
          isExpanded={isExpanded}
        />
      </div>

      {/* User Profile at the bottom */}
      {isAuthenticated ? (
        <UserProfile 
          className="absolute left-3" 
          onMouseEnter={() => setIsExpanded(true)}
          user={user}
          variant="sidebar"
        />
      ) : (
        <div className="relative group h-10">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-3 h-10 w-10 transition-colors duration-200"
            onMouseEnter={() => setIsExpanded(true)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={n3oAvatar} alt="Guest" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                👤
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      )}
    </Card>
  );
};
