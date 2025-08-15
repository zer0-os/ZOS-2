import { useEffect, useState } from 'react';
import { useMatrixClient } from '@/driver/matrix/MatrixProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';


/**
 * Example Matrix chat component demonstrating useMatrixClient hook usage
 */
export function MatrixChat() {
  const { 
    client, 
    ready, 
    error
  } = useMatrixClient();

  const [rooms, setRooms] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Load rooms when client is ready
  useEffect(() => {
    if (!client || !ready) return;

    const loadRooms = () => {
      const joinedRooms = client.getRooms().filter(room => {
        return room.getMyMembership() === 'join';
      });
      
      setRooms(joinedRooms);
      console.log(`📋 Loaded ${joinedRooms.length} rooms`);
    };

    loadRooms();

    // Listen for new rooms
    const onRoom = () => loadRooms();
    (client as any).on('Room', onRoom);

    return () => {
      (client as any).off('Room', onRoom);
    };
  }, [client, ready]);

  // Handle new messages
  useEffect(() => {
    if (!client || !ready) return;

    const onTimeline = (event: any, room: any, toStartOfTimeline: boolean) => {
      if (toStartOfTimeline) return;
      
      if (event.getType() === 'm.room.message') {
        const message = {
          id: event.getId(),
          roomId: room.roomId,
          roomName: room.name || room.roomId,
          sender: event.getSender(),
          content: event.getContent().body,
          timestamp: event.getTs(),
        };
        
        setMessages(prev => [message, ...prev].slice(0, 50)); // Keep last 50 messages
      }
    };

    (client as any).on('Room.timeline', onTimeline);

    return () => {
      (client as any).off('Room.timeline', onTimeline);
    };
  }, [client, ready]);

  if (!ready) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Matrix Chat</CardTitle>
          <CardDescription>Matrix integration not available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please log in to enable Matrix chat features.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-red-600">Matrix Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <p className="text-sm text-muted-foreground">
            Please refresh the page to retry.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            ready ? 'bg-green-500' : 'bg-gray-500'
          }`} />
          Matrix Chat
        </CardTitle>
        <CardDescription>
          {ready ? 'Connected and ready' : 'Disconnected'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex gap-2">
          <p className="text-sm text-muted-foreground">
            {ready ? 'Matrix client is ready for chat' : 'Matrix client is initializing...'}
          </p>
        </div>

        {/* Rooms */}
        {ready && (
          <div>
            <h3 className="font-semibold mb-2">Rooms ({rooms.length})</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {rooms.map(room => (
                <div key={room.roomId} className="text-sm p-2 bg-muted rounded">
                  {room.name || room.roomId}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Messages */}
        {ready && messages.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Recent Messages</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {messages.map(msg => (
                <div key={msg.id} className="text-sm p-2 bg-muted rounded">
                  <div className="font-medium text-xs text-muted-foreground">
                    {msg.roomName} • {msg.sender}
                  </div>
                  <div>{msg.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ready && messages.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No recent messages
          </div>
        )}
      </CardContent>
    </Card>
  );
}
