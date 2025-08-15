/**
 * Hook to fetch and organize Matrix rooms for the IndexPanel
 * Categorizes rooms into direct messages, groups, and channels
 */

import { useState, useEffect } from 'react';
import { useChatPort } from '@/kernel/providers/ServicesProvider';
import type { ChatRoom } from '@/kernel/ports/chat';

export interface OrganizedRooms {
  directMessages: ChatRoom[];
  groups: ChatRoom[];
  channels: ChatRoom[];
  all: ChatRoom[];
  recentChats: ChatRoom[];
  loading: boolean;
  error: string | null;
}

export function useMatrixRoomsForIndex(): OrganizedRooms {
  const chatPort = useChatPort();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchRooms = async () => {
      if (!chatPort) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Check if connected first
        if (!chatPort.isConnected()) {
          await chatPort.connect();
          // Wait a bit for initial sync
          if (chatPort.waitForSync) {
            await chatPort.waitForSync(5000);
          }
        }

        const fetchedRooms = await chatPort.getRooms();
        
        if (mounted) {
          setRooms(fetchedRooms);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to fetch rooms:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
          setLoading(false);
        }
      }
    };

    fetchRooms();

    // Set up room update listener
    let unsubscribe: (() => void) | undefined;
    if (chatPort) {
      unsubscribe = chatPort.onRoomUpdate((updatedRoom) => {
        setRooms(prevRooms => {
          const index = prevRooms.findIndex(r => r.id === updatedRoom.id);
          if (index >= 0) {
            const newRooms = [...prevRooms];
            newRooms[index] = updatedRoom;
            return newRooms;
          } else {
            // New room
            return [...prevRooms, updatedRoom];
          }
        });
      });
    }

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [chatPort]);

  // Organize rooms into categories
  const organizedRooms: OrganizedRooms = {
    directMessages: [],
    groups: [],
    channels: [],
    all: rooms,
    recentChats: [],
    loading,
    error
  };

  // Only organize if we have rooms
  if (rooms.length > 0) {
    // Categorize rooms
    rooms.forEach(room => {
      // Skip rooms we're not joined to
      if (!room.isJoined) return;

      if (room.type === 'direct') {
        organizedRooms.directMessages.push(room);
      } else if (room.type === 'channel' || room.name.startsWith('#')) {
        organizedRooms.channels.push(room);
      } else if (room.type === 'group') {
        organizedRooms.groups.push(room);
      } else {
        // Default to group for unknown types
        organizedRooms.groups.push(room);
      }
    });

    // Sort each category by last activity (most recent first)
    const sortByActivity = (a: ChatRoom, b: ChatRoom) => {
      const aTime = a.bumpStamp || a.lastActiveTimestamp || 0;
      const bTime = b.bumpStamp || b.lastActiveTimestamp || 0;
      return bTime - aTime;
    };

    organizedRooms.directMessages.sort(sortByActivity);
    organizedRooms.groups.sort(sortByActivity);
    organizedRooms.channels.sort(sortByActivity);

    // Get top 10 most recent chats across all categories
    organizedRooms.recentChats = [...rooms]
      .filter(room => room.isJoined)
      .sort(sortByActivity)
      .slice(0, 10);
  }

  return organizedRooms;
}
