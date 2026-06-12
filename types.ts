export interface LocalSession {
  my_id: string;
  my_username: string;
  pin: string;
  is_logged_in: boolean;
  profile_picture?: string;
  bio?: string;
}

export interface LocalContact {
  contact_id: string;
  contact_name: string;
}

export interface LocalGroup {
  group_id: string;
  group_name: string;
  frequency_key: string;
}

export type MessageType = 'text' | 'image' | 'audio' | 'file' | 'sticker';

export interface LocalMessage {
  message_id: string;
  chat_id: string;
  sender_id: string;
  message_type: MessageType;
  message_text: string;
  media_data?: string; // Base64 string for image/audio
  file_name?: string;  // Name of the file
  timestamp: number;
  is_read?: boolean;   // Status dibaca
}

export type AppScreen = 'SPLASH' | 'SETUP' | 'WEATHER' | 'PIN' | 'DASHBOARD' | 'CHAT_ROOM' | 'ADD_CONTACT' | 'PROFILE';
