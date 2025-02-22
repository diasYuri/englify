import { IconRobot } from '@tabler/icons-react';
import { ChatMessage } from './ChatMessage';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  isAudio?: boolean;
  isResponseToAudio?: boolean;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
        <IconRobot size={48} className="text-primary-300" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-gray-700">Welcome to Englify!</h2>
          <p className="text-gray-500">Start a conversation to improve your English skills.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-20 pb-4 px-4">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          content={message.content}
          isUser={message.sender === 'user'}
          isAudio={message.isAudio}
          isResponseToAudio={message.isResponseToAudio}
        />
      ))}
    </div>
  );
}
