'use client';

import { memo } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

interface HistoryPopupButtonProps {
  hasMessages: boolean;
  onClick: () => void;
  isTalking: boolean;
}

// Memoize the component
export const HistoryPopupButton = memo(function HistoryPopupButton({ hasMessages, onClick, isTalking }: HistoryPopupButtonProps) {
  if (!hasMessages) return null;
  
  return (
    <div 
      className={`fixed bottom-20 right-6 transition-all duration-300 transform ${
        isTalking ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
      }`}
    >
      <button
        onClick={onClick}
        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        aria-label="Show conversation history"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
        <span className="ml-2 text-sm font-medium hidden md:inline">View History</span>
      </button>
    </div>
  );
}); 