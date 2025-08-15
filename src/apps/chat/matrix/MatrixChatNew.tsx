/**
 * Example Matrix chat component using the new ports & adapters architecture
 * Demonstrates clean separation of concerns and proper use of ChatPort
 */

import { useEffect, useState } from 'react';
import { useChatPort } from '@/kernel/providers/ServicesProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import type { ChatMessage, ChatRoom } from '@/kernel/ports/chat';

export function MatrixChatNew() {
  const chatPort = useChatPort();
  
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load rooms when chat port is available
  useEffect(() => {
    if (!chatPort || !chatPort.isConnected()) {
      setIsLoading(true);
      return;
    }

    const loadRooms = async () => {
      try {
        setError(null);
        const roomList = await chatPort.getRooms();
        setRooms(roomList);
        setIsLoading(false);
        
        // Auto-select first room if none selected
        if (!selectedRoom && roomList.length > 0) {
          setSelectedRoom(roomList[0].id);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load rooms';
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    loadRooms();

    // Listen for room updates
    const unsubscribeRooms = chatPort.onRoomUpdate((room) => {
      setRooms(prev => {
        const existingIndex = prev.findIndex(r => r.id === room.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = room;
          return updated;
        } else {
          return [...prev, room];
        }
      });
    });

    return unsubscribeRooms;
  }, [chatPort, selectedRoom]);

  // Load messages for selected room
  useEffect(() => {
    if (!chatPort || !selectedRoom || !chatPort.isConnected()) {
      return;
    }

    const loadMessages = async () => {
      try {
        const messageList = await chatPort.getMessages(selectedRoom, 50);
        setMessages(messageList.reverse()); // Show newest at bottom
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
        setError(errorMessage);
      }
    };

    loadMessages();

    // Listen for new messages
    const unsubscribeMessages = chatPort.onMessage((message) => {
      if (message.roomId === selectedRoom) {
        setMessages(prev => [...prev, message]);
      }
    });

    return unsubscribeMessages;
  }, [chatPort, selectedRoom]);

  // Handle connection state
  useEffect(() => {
    if (!chatPort) return;

    const unsubscribeConnection = chatPort.onConnectionChange((connected) => {
      if (!connected) {
        setError('Connection lost');
      } else {
        setError(null);
      }
    });

    return unsubscribeConnection;
  }, [chatPort]);

  const handleSendMessage = async (content: string) => {
    if (!chatPort || !selectedRoom || !content.trim()) return;

    try {
      await chatPort.sendMessage(selectedRoom, content.trim());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  if (!chatPort) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Matrix Chat</CardTitle>
          <CardDescription>Chat service not available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please log in to access Matrix chat functionality.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Matrix Chat</CardTitle>
          <CardDescription>Loading chat rooms...</CardDescription>
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
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Matrix Chat</CardTitle>
          <CardDescription className="text-destructive">Error: {error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Unable to connect to Matrix chat. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedRoomData = rooms.find(r => r.id === selectedRoom);

  return (
    <div className="h-full flex">
      {/* Room List */}
      <div className="w-64 border-r border-border">
        <Card className="h-full rounded-none border-0">
          <CardHeader>
            <CardTitle className="text-sm">Rooms ({rooms.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`w-full text-left p-3 hover:bg-accent transition-colors ${
                    selectedRoom === room.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="font-medium text-sm truncate">{room.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {room.type} • {room.memberCount || 0} members
                  </div>
                  {room.lastMessage && (
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {room.lastMessage.content}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="h-full rounded-none border-0">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedRoomData ? selectedRoomData.name : 'Select a room'}
            </CardTitle>
            {selectedRoomData && (
              <CardDescription>
                {selectedRoomData.type} • {selectedRoomData.memberCount || 0} members
              </CardDescription>
            )}
          </CardHeader>
          
          {selectedRoom ? (
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex flex-col space-y-1">
                    <div className="flex items-baseline space-x-2">
                      <span className="font-medium text-sm">{message.sender}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm pl-2">{message.content}</div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="border-t border-border p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const input = form.elements.namedItem('message') as HTMLInputElement;
                    if (input.value.trim()) {
                      handleSendMessage(input.value);
                      input.value = '';
                    }
                  }}
                  className="flex space-x-2"
                >
                  <input
                    name="message"
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <div className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">Select a room to start chatting</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
