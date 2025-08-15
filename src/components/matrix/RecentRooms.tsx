/**
 * RecentRooms - Component that shows the most recently active rooms
 * Uses proper Matrix SDK sorting by last activity timestamp
 */

import { useState } from 'react';
import { RoomList } from './RoomList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { useRecentRooms } from '@/hooks/useRecentRooms';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/ui/button';

export function RecentRooms({ 
  onRoomSelect,
  limit = 20 
}: { 
  onRoomSelect?: (roomId: string) => void;
  limit?: number;
}) {
  const { rooms, loading, error, refresh } = useRecentRooms(limit);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId);
    console.log('Selected room:', roomId);
    onRoomSelect?.(roomId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>Loading your most active rooms...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription className="text-red-500">Error loading rooms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>
                Your {rooms.length} most recently active rooms
              </CardDescription>
            </div>
            <Button onClick={refresh} variant="ghost" size="icon" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <RoomList 
            rooms={rooms} 
            onRoomSelect={handleRoomSelect} 
            selectedRoomId={selectedRoom}
          />
        </CardContent>
      </Card>
    </div>
  );
}