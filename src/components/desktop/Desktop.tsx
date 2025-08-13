import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar } from './Sidebar';
import { Topbar } from './TopBar';
import { IndexPanel } from './IndexPanel';

import { useBackgroundClass } from '@/hooks/useBackgroundClass';

interface DesktopProps {
  children?: React.ReactNode;
  className?: string;
  onOpenApp?: (appId: string, props?: Record<string, any>) => void;
}

export const Desktop: React.FC<DesktopProps> = ({
  children,
  className = '',
  onOpenApp
}) => {
  const [selectedApp, setSelectedApp] = useState<string | null>('chat');
  const backgroundClass = useBackgroundClass();

  const handleSidebarClick = (appId: string) => {
    setSelectedApp(appId);
    // Don't open app window on sidebar click anymore
  };

  const handleItemClick = (appId: string, itemName: string) => {
    // Open window when clicking on IndexPanel items
    if (appId === 'chat') {
      // For chat items, pass the item name and determine chat type
      const chatType = getChatType(itemName);
      onOpenApp?.(appId, { 
        chatName: itemName,
        chatType: chatType
      });
    } else {
      onOpenApp?.(appId);
    }
  };

  const getChatType = (itemName: string): string => {
    if (itemName.startsWith('#')) return 'channel';
    if (itemName.includes('Discussion') || itemName.includes('Talk') || itemName.includes('Updates')) return 'group';
    // If it's a person's name (contains space and looks like "First Last")
    if (itemName.includes(' ') && !itemName.includes('Discussion') && !itemName.includes('Talk')) return 'direct';
    return 'group';
  };

  return (
    <Card className={`min-h-screen relative overflow-hidden border-0 rounded-none ${backgroundClass} ${className}`}>
      {/* Sidebar */}
      <Sidebar onOpenApp={handleSidebarClick} selectedApp={selectedApp} />

      {/* Index Panel */}
      <IndexPanel selectedApp={selectedApp} onItemClick={handleItemClick} />

      {/* Top Bar */}
      <Topbar />

      {/* Desktop content */}
      <ScrollArea className="relative z-10 h-screen ml-80 pt-12">
        <div className="pl-4">
          {children}
        </div>
      </ScrollArea>
    </Card>
  );
};
