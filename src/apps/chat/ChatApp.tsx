import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { ScrollArea } from '@/ui/scroll-area';
import { Send, MoreVertical, Loader2 } from 'lucide-react';
import { useChatPort } from '@/kernel/providers/ServicesProvider';
import type { ChatMessage, ChatRoom } from '@/kernel/ports/chat';

interface ChatAppProps {
  chatName?: string;
  chatType?: string;
  roomId?: string;
}

export const ChatApp: React.FC<ChatAppProps> = ({ 
  chatName = 'General Discussion',
  chatType = 'channel',
  roomId
}) => {
  const chatPort = useChatPort();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user ID
  useEffect(() => {
    if (!chatPort) return;
    
    const loadCurrentUser = async () => {
      try {
        const user = await chatPort.getCurrentUser();
        setCurrentUserId(user?.id || null);
      } catch (err) {
        console.error('Failed to get current user:', err);
      }
    };
    
    loadCurrentUser();
  }, [chatPort]);

  // Load room details and messages when roomId changes
  useEffect(() => {
    if (!chatPort || !roomId) {
      setIsLoading(false);
      return;
    }

    const loadRoomData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`[ChatApp] Loading room data for roomId: ${roomId}`);
        
        // Focus on the room to ensure messages are loaded in sliding sync
        if (chatPort.focusRoom) {
          console.log(`[ChatApp] Calling focusRoom for ${roomId}`);
          await chatPort.focusRoom(roomId, 50);
        }
        
        // Load room details
        console.log(`[ChatApp] Getting room details for ${roomId}`);
        const roomData = await chatPort.getRoom(roomId);
        if (roomData) {
          console.log(`[ChatApp] Room loaded: ${roomData.name}, type: ${roomData.type}`);
          setRoom(roomData);
        }
        
        // Load messages for this room
        console.log(`[ChatApp] Getting messages for ${roomId}`);
        const messageList = await chatPort.getMessages(roomId, 50);
        console.log(`[ChatApp] Received ${messageList.length} messages`);
        
        // Messages come from the API with newest first, reverse to show oldest first (newest at bottom)
        const orderedMessages = [...messageList].reverse();
        console.log(`[ChatApp] First message timestamp: ${orderedMessages[0]?.timestamp}, Last message timestamp: ${orderedMessages[orderedMessages.length - 1]?.timestamp}`);
        setMessages(orderedMessages);
        
        setIsLoading(false);
        
        // Scroll to bottom after messages load
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        }, 100);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load room data';
        console.error('[ChatApp] Failed to load room data:', err);
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    loadRoomData();
  }, [chatPort, roomId]);

  // Listen for new messages
  useEffect(() => {
    if (!chatPort || !roomId) return;

    const unsubscribe = chatPort.onMessage((message) => {
      if (message.roomId === roomId) {
        setMessages(prev => [...prev, message]);
        // Auto-scroll to bottom for new messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });

    return unsubscribe;
  }, [chatPort, roomId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    // Use a small timeout to ensure DOM has updated
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  // Listen for room updates (including when messages get decrypted)
  useEffect(() => {
    if (!chatPort || !roomId) return;

    const unsubscribe = chatPort.onRoomUpdate(async (updatedRoom) => {
      if (updatedRoom.id === roomId) {
        setRoom(updatedRoom);
        
        // Check current messages for encrypted placeholders that might decrypt later
        setMessages(prevMessages => {
          const hasEncryptedPlaceholders = prevMessages.some(msg => 
            msg.content.includes('Failed to decrypt')
          );
          
          if (hasEncryptedPlaceholders) {
            console.log('[ChatApp] Detected failed decryption messages, attempting to reload...');
            // Reload messages asynchronously to see if any can now be decrypted
            chatPort.getMessages(roomId, 50).then(messageList => {
              // Ensure proper ordering: oldest first, newest at bottom
              setMessages([...messageList].reverse());
            }).catch(err => {
              console.error('[ChatApp] Failed to reload messages:', err);
            });
          }
          
          return prevMessages; // Return unchanged for now
        });
      }
    });

    return unsubscribe;
  }, [chatPort, roomId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatPort || !roomId || isSending) return;

    setIsSending(true);
    try {
      await chatPort.sendMessage(roomId, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Failed to send message:', err);
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const getChatIcon = () => {
    const type = room?.type || chatType;
    if (type === 'channel' || room?.name.startsWith('#')) return '#';
    if (type === 'direct') return '👤';
    return '💬';
  };

  const getChatName = () => {
    return room?.name || chatName;
  };

  const getChatTypeLabel = () => {
    const type = room?.type || chatType;
    if (type === 'channel' || room?.name.startsWith('#')) return 'Channel';
    if (type === 'direct') return 'Direct Message';
    return 'Group Chat';
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-transparent">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (!roomId) {
    return (
      <div className="h-full flex items-center justify-center bg-transparent">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Select a conversation from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-transparent overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground text-lg">{getChatIcon()}</span>
          <h2 className="text-lg font-semibold text-foreground">
            {getChatName()}
          </h2>
          <span className="text-xs text-muted-foreground">
            {getChatTypeLabel()}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No messages yet. Start a conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender === currentUserId;
              const senderName = message.sender.split(':')[0].substring(1); // Extract username from @user:server format
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    } rounded-lg p-3`}
                  >
                    {!isOwnMessage && (
                      <div className="text-xs text-muted-foreground mb-1 font-medium">
                        {senderName}
                      </div>
                    )}
                    <div className="text-sm break-words whitespace-pre-wrap overflow-wrap-anywhere">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${getChatName()}...`}
            className="flex-1 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring min-w-0"
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={!newMessage.trim() || isSending || !chatPort}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
