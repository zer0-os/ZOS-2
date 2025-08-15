/**
 * Chat Port - Domain interface for chat functionality
 * This defines the contract that any chat implementation must fulfill
 */

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: string;
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'file';
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  memberCount?: number;
  lastMessage?: ChatMessage;
  lastActiveTimestamp?: number;
  bumpStamp?: number; // Sliding sync recency index from getBumpStamp()
  isJoined: boolean;
  isEncrypted?: boolean;
}

export interface ChatUser {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  presence?: 'online' | 'offline' | 'away';
}

export interface ChatPort {
  // Room operations
  getRooms(): Promise<ChatRoom[]>;
  getRoom(roomId: string): Promise<ChatRoom | null>;
  joinRoom(roomId: string): Promise<void>;
  leaveRoom(roomId: string): Promise<void>;
  
  // Message operations
  getMessages(roomId: string, limit?: number): Promise<ChatMessage[]>;
  loadMoreMessages?(roomId: string, fromToken?: string, limit?: number): Promise<ChatMessage[]>;
  sendMessage(roomId: string, content: string): Promise<ChatMessage>;
  
  // User operations
  getCurrentUser(): Promise<ChatUser | null>;
  getRoomMembers(roomId: string): Promise<ChatUser[]>;
  
  // Connection state
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  waitForSync?(timeoutMs?: number): Promise<void>;
  
  // Event handling
  onMessage(callback: (message: ChatMessage) => void): () => void;
  onRoomUpdate(callback: (room: ChatRoom) => void): () => void;
  onConnectionChange(callback: (connected: boolean) => void): () => void;
}
