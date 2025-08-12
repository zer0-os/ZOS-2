import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, MessageCircle, Wallet, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeSwitcher';
import { SettingsPopup } from '@/components/SettingsPopup';
import { SidebarItem } from '@/components/SidebarItem';

import n3oAvatar from '@/assets/n3o-avatar.jpg';


interface SidebarProps {
  className?: string;
  onOpenApp?: (appId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  onOpenApp
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
        />

        <SidebarItem
          icon={Home}
          label="Feed"
          onClick={() => handleAppClick('feed')}
          onMouseEnter={() => setIsExpanded(true)}
          isExpanded={isExpanded}
        />

        <SidebarItem
          icon={Wallet}
          label="Wallet"
          onClick={() => handleAppClick('wallet')}
          onMouseEnter={() => setIsExpanded(true)}
          isExpanded={isExpanded}
        />
      </div>

      {/* Settings and Theme Switcher */}
      <div className="mt-auto space-y-2 mb-4">
        {/* Theme Toggle */}
        <SidebarItem
          label="Toggle Theme"
          onMouseEnter={() => setIsExpanded(true)}
          isExpanded={isExpanded}
          customContent={
            <div className="absolute left-3 h-10 w-10 flex items-center justify-center">
              <ThemeToggle />
            </div>
          }
        />

        {/* Settings Button with Popup */}
        <SidebarItem
          icon={Settings}
          label="Settings"
          onMouseEnter={() => setIsExpanded(true)}
          isExpanded={isExpanded}
          wrapper={SettingsPopup}
        />
      </div>

      {/* User Profile at the bottom */}
      <div className="relative group h-10">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-3 h-10 w-10 transition-colors duration-200"
          onMouseEnter={() => setIsExpanded(true)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={n3oAvatar} alt="n3o" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              🚀
            </AvatarFallback>
          </Avatar>
          {/* Online status indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
        </Button>
        <div
          className={`absolute left-16 top-0 h-10 flex items-center pointer-events-none transition-all duration-300 ${
            isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
          }`}
        >
          <div className="flex flex-col items-start pl-2">
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200 whitespace-nowrap">
              n3o
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              0://n3o
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
