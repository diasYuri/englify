import { useEffect, useState } from 'react';
import { IconRobot, IconUser } from '@tabler/icons-react';
import { AudioMessage } from './AudioMessage';
import { AudioPlayer } from './AudioPlayer';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  isAudio?: boolean;
}

const TypingIndicator = () => (
  <div className="flex space-x-2 p-2">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

export function ChatMessage({ content, isUser, isAudio }: ChatMessageProps) {
  const [isTyping, setIsTyping] = useState(!isUser && content === '');
  const [displayContent, setDisplayContent] = useState(content);

  useEffect(() => {
    if (!isUser) {
      setIsTyping(content === '');
      setDisplayContent(content);
    } else {
      setDisplayContent(content);
      setIsTyping(false);
    }
  }, [content, isUser]);

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isUser ? 'bg-primary-100' : 'bg-gray-100'}`}>
        {isUser ? (
          <IconUser size={20} className="text-primary-600" />
        ) : (
          <IconRobot size={20} className="text-gray-600" />
        )}
      </div>
      <div
        className={`relative flex-1 max-w-2xl rounded-2xl px-4 py-3 ${isUser ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-800'}`}
      >
        {isTyping ? (
          <TypingIndicator />
        ) : (
          <div className="space-y-2">
            {isAudio ? (
              <AudioMessage transcription={displayContent} />
            ) : (
              <>
                <div className="whitespace-pre-wrap">{displayContent}</div>
                {!isUser && displayContent && (
                  <div className="mt-2 flex items-center space-x-2">
                    <AudioPlayer text={displayContent} />
                    <span className="text-xs text-gray-500">Listen to response</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
