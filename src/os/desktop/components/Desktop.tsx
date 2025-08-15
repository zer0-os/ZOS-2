import React, { useState } from 'react';
import { Card } from '@/ui/card';
import { ScrollArea } from '@/ui/scroll-area';
import { Sidebar } from './Sidebar';
import { Topbar } from './TopBar';
import { IndexPanel } from './IndexPanel';
import { MatrixDevPanel } from '@/apps/chat/matrix/MatrixDevPanel';

import { useBackgroundClass } from '@/os/theme/useBackgroundClass';

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
      // For chat items, itemName is now the room ID
      // We pass the room ID directly
      onOpenApp?.(appId, { 
        roomId: itemName,
        chatType: 'room' // We'll let the chat app determine the actual type
      });
    } else {
      onOpenApp?.(appId);
    }
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
        <div className="p-4">
          {/* Desktop content */}
          {children}
        </div>
      </ScrollArea>

      {/* Matrix Development Panel - Floating */}
      <MatrixDevPanel />
    </Card>
  );
};
