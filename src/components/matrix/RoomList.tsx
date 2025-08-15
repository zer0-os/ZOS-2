/**
 * RoomList Component - Shows rooms sorted by last activity
 * Uses the proper Matrix SDK sorting based on getLastActiveTimestamp()
 */

import { MessageSquare, Lock, Hash, Users, User, Clock } from 'lucide-react';
import { ScrollArea } from '@/ui/scroll-area';
import { Avatar } from '@/ui/avatar';
import { Card } from '@/ui/card';
import type { ChatRoom } from '@/kernel/ports/chat';

interface RoomListProps {
  rooms: ChatRoom[];
  onRoomSelect?: (roomId: string) => void;
  selectedRoomId?: string | null;
  className?: string;
}

export function RoomList({ 
  rooms,
  onRoomSelect,
  selectedRoomId,
  className = ''
}: RoomListProps) {

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // Format the actual time
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    // If it's today, just show the time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return timeStr;
    }
    
    // If it's yesterday, show "Yesterday" + time
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${timeStr}`;
    }

    // Otherwise show date + time
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    return `${dateStr} ${timeStr}`;
  };

  const getRoomIcon = (room: ChatRoom) => {
    if (room.type === 'direct') return <User className="w-4 h-4" />;
    if (room.type === 'channel' || room.name.startsWith('#')) return <Hash className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
  };

  const handleRoomClick = (roomId: string) => {
    onRoomSelect?.(roomId);
  };

  if (rooms.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No conversations yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <ScrollArea className="h-full max-h-[600px]">
        <div className="divide-y divide-border">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`
                p-3 hover:bg-accent cursor-pointer transition-colors
                ${selectedRoomId === room.id ? 'bg-accent' : ''}
              `}
              onClick={() => handleRoomClick(room.id)}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    {getRoomIcon(room)}
                  </div>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm truncate">
                        {room.name}
                      </span>
                      {room.isEncrypted && (
                        <Lock className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                    {room.lastActiveTimestamp && (
                      <div 
                        className="flex items-center gap-1 text-xs text-muted-foreground"
                        title={new Date(room.lastActiveTimestamp).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      >
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">
                          {formatTime(room.lastActiveTimestamp)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Last Message Preview (only if already loaded) */}
                  {room.lastMessage ? (
                    <div className="text-sm text-muted-foreground truncate">
                      <span className="font-medium">
                        {room.lastMessage.sender.split(':')[0].replace('@', '')}:
                      </span>{' '}
                      {room.lastMessage.content.substring(0, 100)}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      Click to view messages
                    </div>
                  )}

                  {/* Room Info */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {room.type}
                    </span>
                    {room.memberCount && room.memberCount > 2 && (
                      <span className="text-xs text-muted-foreground">
                        • {room.memberCount} members
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}