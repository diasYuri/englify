'use client';

import { AudioMessage } from './audio/audio-message';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  audioUrl?: string;
  autoPlay?: boolean;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="py-8 px-4 space-y-8">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.sender === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] rounded-xl p-4 ${
              message.sender === 'user'
                ? 'bg-primary-500 text-white'
                : 'bg-white shadow-sm'
            }`}
          >
            <div className="prose prose-sm max-w-none">
              {message.content}
            </div>
            {message.audioUrl && (
              <div className="mt-4">
                <AudioMessage
                  audioUrl={message.audioUrl}
                  transcription={message.content}
                  autoPlay={message.autoPlay}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
