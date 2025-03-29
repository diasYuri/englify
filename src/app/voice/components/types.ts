// Types for voice components


export interface MessageEvent {
  role: string;
  content: string;
}

export interface SessionEvent {
  id: string;
  object: string;
  expires_at: number;
  model: string;
  voice: string;
}

export type RealtimeEvent = {
  type: string;
  event_id?: string;
  transcript?: string;
  message?: MessageEvent;
  error?: {
    type: string;
    code: string;
    message: string;
    param?: string;
  };
  item?: {
    role: string;
    content: string;
  };
  content?: {
    role: string;
    content: string;
  };
  response?: {
    message?: {
      role: string;
      content: string;
    }
  };
  session?: SessionEvent;
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface VoiceStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
}

export interface VoiceRobotProps {
  isConnected: boolean;
  isConnecting: boolean;
  isTalking: boolean;
}

export interface VoiceMicButtonProps {
  isConnected: boolean;
  isConnecting: boolean;
  isTalking: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
}

export interface ConversationHistoryProps {
  messages: ChatMessage[];
  isVisible: boolean;
}

export interface ErrorMessageProps {
  message: string | null;
} 