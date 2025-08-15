import React, { useState } from 'react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { ScrollArea } from '@/ui/scroll-area';
import { Send, MoreVertical } from 'lucide-react';

interface ChatAppProps {
  chatName?: string;
  chatType?: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isOwnMessage: boolean;
}

export const ChatApp: React.FC<ChatAppProps> = ({ 
  chatName = 'General Discussion',
  chatType = 'channel'
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Alice',
      content: 'Hey everyone! How\'s the project coming along?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      isOwnMessage: false
    },
    {
      id: '2',
      sender: 'Bob',
      content: 'Making good progress on the frontend. The new components are looking great!',
      timestamp: new Date(Date.now() - 1000 * 60 * 3),
      isOwnMessage: false
    },
    {
      id: '3',
      sender: 'You',
      content: 'Awesome! I just finished the chat interface. Ready for testing.',
      timestamp: new Date(Date.now() - 1000 * 60 * 1),
      isOwnMessage: true
    }
  ]);

  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'You',
      content: newMessage.trim(),
      timestamp: new Date(),
      isOwnMessage: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const getChatIcon = () => {
    if (chatType === 'channel') return '#';
    if (chatType === 'direct') return '👤';
    return '💬';
  };

  return (
    <div className="h-full min-h-[500px] flex flex-col bg-transparent">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground text-lg">{getChatIcon()}</span>
          <h2 className="text-lg font-semibold text-foreground">
            {chatName}
          </h2>
          <span className="text-xs text-muted-foreground">
            {chatType === 'channel' ? 'Channel' : chatType === 'direct' ? 'Direct Message' : 'Chat'}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] ${
                  message.isOwnMessage
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                } rounded-lg p-3`}
              >
                {!message.isOwnMessage && (
                  <div className="text-xs text-muted-foreground mb-1 font-medium">
                    {message.sender}
                  </div>
                )}
                <div className="text-sm">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${chatName}...`}
            className="flex-1 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring"
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={!newMessage.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
