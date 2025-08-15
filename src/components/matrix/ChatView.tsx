/**
 * ChatView - Component for displaying and interacting with a chat room
 * Uses lazy loading to fetch messages only when the room is opened
 */

import { useState, useRef, useEffect } from 'react';
import { useRoomMessages } from '@/hooks/useRoomMessages';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { ScrollArea } from '@/ui/scroll-area';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Send, Loader2, ChevronUp } from 'lucide-react';
import type { ChatRoom } from '@/kernel/ports/chat';

interface ChatViewProps {
  room: ChatRoom | null;
  className?: string;
}

export function ChatView({ room, className = '' }: ChatViewProps) {
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    loading,
    error,
    hasMore,
    isInitialLoad,
    loadMoreMessages,
    sendMessage
  } = useRoomMessages(room?.id || null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isInitialLoad && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isInitialLoad]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      await sendMessage(content);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore the input on error
      setMessageInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!room) {
    return (
      <Card className={`flex items-center justify-center h-full ${className}`}>
        <CardContent className="text-center text-muted-foreground">
          <p>Select a room to start chatting</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          {room.name}
          {room.isEncrypted && (
            <span className="text-xs text-green-500">🔒 Encrypted</span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {/* Load more button */}
          {hasMore && !isInitialLoad && (
            <div className="text-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMoreMessages}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Load earlier messages
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Loading state for initial load */}
          {isInitialLoad && loading && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center text-red-500 p-4">
              <p>Error: {error}</p>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwnMessage = message.sender.includes('@'); // Simple check, improve later
              const senderName = message.sender.split(':')[0].replace('@', '');
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {!isOwnMessage && (
                      <div className="text-xs font-semibold mb-1 opacity-70">
                        {senderName}
                      </div>
                    )}
                    <div className="break-words">{message.content}</div>
                    <div className="text-xs mt-1 opacity-60">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Message input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sending}
              size="icon"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
