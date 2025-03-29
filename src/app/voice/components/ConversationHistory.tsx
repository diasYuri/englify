'use client';

import { ConversationHistoryProps } from './types';

export function ConversationHistory({ messages, isVisible }: ConversationHistoryProps) {
  if (!isVisible || messages.length === 0) return null;
  
  return (
    <div className="w-full max-w-2xl bg-white rounded-lg p-4 shadow-md mb-12 border border-gray-100">
      <h3 className="text-sm font-medium mb-4 text-gray-700 border-b pb-2">Conversation History</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg text-sm shadow-sm ${
              message.role === 'user' 
                ? 'bg-blue-100 ml-auto max-w-[80%] text-blue-900' 
                : 'bg-gray-100 mr-auto max-w-[80%] text-gray-800'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
    </div>
  );
} 