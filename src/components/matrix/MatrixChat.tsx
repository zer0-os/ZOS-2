/**
 * MatrixChat - Complete chat interface with room list and lazy-loaded messages
 * Demonstrates the proper implementation of lazy loading
 */

import { useState } from 'react';
import { RecentRooms } from './RecentRooms';
import { ChatView } from './ChatView';
import { useServices } from '@/kernel/providers/ServicesProvider';
import type { ChatRoom } from '@/kernel/ports/chat';

export function MatrixChat() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const { chatPort, isReady } = useServices();

  const handleRoomSelect = async (roomId: string) => {
    if (!chatPort || !isReady) return;
    
    try {
      // Get the full room details when selected
      const room = await chatPort.getRoom(roomId);
      setSelectedRoom(room);
    } catch (error) {
      console.error('Failed to load room:', error);
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Room list - no message fetching happens here */}
      <div className="w-1/3 min-w-[300px] max-w-[400px]">
        <RecentRooms 
          onRoomSelect={handleRoomSelect}
          limit={20}
        />
      </div>

      {/* Chat view - messages are lazy loaded when room is selected */}
      <div className="flex-1">
        <ChatView room={selectedRoom} />
      </div>
    </div>
  );
}
