/**
 * useRoomMessages - Hook for lazy loading messages when a room is opened
 * Only fetches messages when needed, with pagination support
 */

import { useState, useEffect, useCallback } from 'react';
import { useServices } from '@/kernel/providers/ServicesProvider';
import type { ChatMessage } from '@/kernel/ports/chat';

interface UseRoomMessagesOptions {
  initialLimit?: number;
  autoLoad?: boolean;
}

export function useRoomMessages(
  roomId: string | null,
  options: UseRoomMessagesOptions = {}
) {
  const { initialLimit = 50, autoLoad = true } = options;
  const { chatPort, isReady } = useServices();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load initial messages when room is selected
  const loadMessages = useCallback(async () => {
    if (!roomId || !chatPort || !isReady) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`[useRoomMessages] Loading messages for room ${roomId}`);
      
      // Fetch initial messages - this will paginate if needed
      const initialMessages = await chatPort.getMessages(roomId, initialLimit);
      
      console.log(`[useRoomMessages] Loaded ${initialMessages.length} messages`);
      
      setMessages(initialMessages);
      setHasMore(initialMessages.length === initialLimit);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('[useRoomMessages] Failed to load messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [roomId, chatPort, isReady, initialLimit]);

  // Load more historical messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!roomId || !chatPort || !isReady || loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`[useRoomMessages] Loading more messages for room ${roomId}`);
      
      // Use loadMoreMessages if available, otherwise fallback to getMessages
      let olderMessages: ChatMessage[];
      if (chatPort.loadMoreMessages) {
        olderMessages = await chatPort.loadMoreMessages(roomId, undefined, initialLimit);
      } else {
        // Fallback: try to get more messages than we have
        const allMessages = await chatPort.getMessages(roomId, messages.length + initialLimit);
        olderMessages = allMessages.slice(0, allMessages.length - messages.length);
      }
      
      console.log(`[useRoomMessages] Loaded ${olderMessages.length} more messages`);
      
      if (olderMessages.length === 0) {
        setHasMore(false);
      } else {
        // Prepend older messages to the beginning
        setMessages(prev => [...olderMessages, ...prev]);
        setHasMore(olderMessages.length === initialLimit);
      }
    } catch (err) {
      console.error('[useRoomMessages] Failed to load more messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more messages');
    } finally {
      setLoading(false);
    }
  }, [roomId, chatPort, isReady, loading, hasMore, messages.length, initialLimit]);

  // Send a message
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!roomId || !chatPort || !isReady) {
      throw new Error('Cannot send message: chat not ready');
    }

    try {
      const sentMessage = await chatPort.sendMessage(roomId, content);
      
      // Add the sent message to the list immediately
      setMessages(prev => [...prev, sentMessage]);
    } catch (err) {
      console.error('[useRoomMessages] Failed to send message:', err);
      throw err;
    }
  }, [roomId, chatPort, isReady]);

  // Load messages when room changes
  useEffect(() => {
    if (roomId && autoLoad) {
      setMessages([]); // Clear previous messages
      setIsInitialLoad(true);
      loadMessages();
    } else if (!roomId) {
      // Clear messages when no room is selected
      setMessages([]);
      setError(null);
      setIsInitialLoad(true);
    }
  }, [roomId, autoLoad, loadMessages]);

  // Listen for new messages in this room
  useEffect(() => {
    if (!chatPort || !roomId) return;

    const unsubscribe = chatPort.onMessage((message) => {
      // Only add messages for the current room
      if (message.roomId === roomId) {
        setMessages(prev => {
          // Check if message already exists (by ID)
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          
          // Add new message to the end
          return [...prev, message];
        });
      }
    });

    return unsubscribe;
  }, [chatPort, roomId]);

  return {
    messages,
    loading,
    error,
    hasMore,
    isInitialLoad,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    refresh: loadMessages
  };
}
