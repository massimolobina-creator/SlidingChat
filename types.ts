
export interface UserSettings {
  nickname: string;
  language: string;
  isOnline: boolean;
  setupComplete: boolean;
  theme: string; // 'turquoise', 'blue', 'purple', 'orange', 'pink'
  notificationsEnabled: boolean;
  blockedUsers: string[]; // Array of user IDs
  peerId?: string; // P2P ID
  serverUrl?: string; // Custom/detected Socket.io Server URL
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface NearbyUser {
  id: string;
  nickname: string;
  language: string;
  coords: Coordinates;
  distance: number; // in meters
  avatar: string;
  status: 'online' | 'offline';
  lastSeen?: number;
  isBot?: boolean;
  peerId?: string; // For P2P connection
  isP2P?: boolean;
  isRetroactive?: boolean;
  checkInTime?: number;
  checkInCaption?: string;
}

export interface RetroactiveCheckIn {
  id: string;
  userId: string;
  nickname: string;
  avatar: string;
  coords: Coordinates;
  timestamp: number; // When they were there
  createdAt: number; // When they posted it
  language: string;
  caption?: string;
}

export interface Message {
  id: string;
  senderId: string; // 'me' or userId
  type: 'text' | 'image' | 'audio' | 'system';
  text?: string; // Content for text messages
  mediaData?: string; // Base64 string for images/audio
  translatedText?: string;
  language?: string; // Source language code (e.g., 'English', 'Italian')
  timestamp: number;
  status?: 'sent' | 'read'; // Read receipt status
  
  // Lazy Timer Logic
  duration?: number; // The set duration in seconds (e.g., 10)
  expiresAt?: number; // The actual calculated timestamp when it dies. If undefined, timer hasn't started.
  
  systemAction?: 'read_receipt'; // For internal P2P signals
  refId?: string; // Reference to another message ID (for read receipts)
}

export interface ChatSession {
  userId: string;
  messages: Message[];
  draft: string;
}

export enum AppScreen {
  INTRO = 'INTRO',
  MAP = 'MAP',
  CHAT = 'CHAT',
  SETTINGS = 'SETTINGS'
}

export type ViewMode = 'MAP' | 'LIST';
