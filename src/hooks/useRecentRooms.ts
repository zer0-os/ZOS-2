/**
 * useRecentRooms - Hook that fetches and maintains the most recently active rooms
 * Uses the proper Matrix SDK methods for sorting by last activity
 */

import { useState, useEffect, useCallback } from 'react';
import { useServices } from '@/kernel/providers/ServicesProvider';
import type { ChatRoom } from '@/kernel/ports/chat';

export function useRecentRooms(limit: number = 20) {
  const { chatPort, isReady, error: serviceError } = useServices();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentRooms = useCallback(async () => {
    if (!isReady || !chatPort) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Wait for sync to be PREPARED before reading rooms
      if (chatPort.waitForSync) {
        await chatPort.waitForSync(15000); // 15 second timeout
      }

      // Get all rooms
      const allRooms = await chatPort.getRooms();

      // Filter to joined rooms only
      const joinedRooms = allRooms.filter(room => room.isJoined);

      // Sort by bumpStamp (sliding sync recency index) - most recent first
      // Falls back to lastActiveTimestamp if bumpStamp not available
      const sortedRooms = joinedRooms
        .sort((a, b) => {
          // Use bumpStamp if available (from sliding sync)
          const stampA = a.bumpStamp ?? a.lastActiveTimestamp ?? 0;
          const stampB = b.bumpStamp ?? b.lastActiveTimestamp ?? 0;
          return stampB - stampA; // Descending order (higher = more recent)
        })
        .slice(0, limit); // Take only the requested number of rooms

      setRooms(sortedRooms);
    } catch (err) {
      console.error('Failed to fetch recent rooms:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [isReady, chatPort, limit]);

  useEffect(() => {
    // Initial fetch
    fetchRecentRooms();

    // Set up real-time listeners
    let unsubscribeRoom: (() => void) | undefined;

    if (chatPort) {
      // Subscribe to RoomEvent.Timeline equivalent (room updates)
      // This will fire when new messages arrive in any room
      unsubscribeRoom = chatPort.onRoomUpdate((updatedRoom) => {
        console.log('[useRecentRooms] Room updated:', updatedRoom.name, 'bumpStamp:', updatedRoom.bumpStamp);
        
        // Update the room in our list and re-sort by bumpStamp
        setRooms(prevRooms => {
          // Check if this room is already in our list
          const existingIndex = prevRooms.findIndex(r => r.id === updatedRoom.id);
          
          let newRooms: ChatRoom[];
          if (existingIndex >= 0) {
            // Update existing room
            newRooms = [...prevRooms];
            newRooms[existingIndex] = updatedRoom;
          } else {
            // Add new room if it's joined
            if (updatedRoom.isJoined) {
              newRooms = [...prevRooms, updatedRoom];
            } else {
              return prevRooms; // No change if room is not joined
            }
          }
          
          // Re-sort by bumpStamp (or fallback to lastActiveTimestamp)
          return newRooms
            .sort((a, b) => {
              const stampA = a.bumpStamp ?? a.lastActiveTimestamp ?? 0;
              const stampB = b.bumpStamp ?? b.lastActiveTimestamp ?? 0;
              return stampB - stampA;
            })
            .slice(0, limit);
        });
      });
    }

    return () => {
      unsubscribeRoom?.();
    };
  }, [fetchRecentRooms, chatPort, limit]);

  useEffect(() => {
    if (serviceError) {
      setError(serviceError);
    }
  }, [serviceError]);

  return { 
    rooms, 
    loading, 
    error, 
    refresh: fetchRecentRooms 
  };
}