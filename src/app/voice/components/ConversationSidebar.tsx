'use client';

import { memo } from 'react';
import { ChatMessage } from './types';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useEffect } from 'react';

interface ConversationSidebarProps {
  messages: ChatMessage[];
  isOpen: boolean;
  onClose: () => void;
}

// Memoize the component
export const ConversationSidebar = memo(function ConversationSidebar({ messages, isOpen, onClose }: ConversationSidebarProps) {
  // Prevent scroll on body when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Conversation History</h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length > 0 ? (
              <div className="space-y-4">
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
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 italic">No conversation history yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}); 