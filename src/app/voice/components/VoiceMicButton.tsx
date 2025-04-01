'use client';

import { memo } from 'react';
import { MicrophoneIcon } from '@heroicons/react/24/solid';
import { VoiceMicButtonProps } from './types';

// Memoize the component
export const VoiceMicButton = memo(function VoiceMicButton({ 
  isConnected, 
  isConnecting, 
  isTalking, 
  onConnect, 
  onDisconnect 
}: VoiceMicButtonProps) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isConnecting}
        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg transform ${
          isConnected 
            ? 'bg-red-500 hover:bg-red-600 hover:scale-105' 
            : isConnecting 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 hover:rotate-3'
        }`}
        aria-label={isConnected ? "Disconnect" : "Connect"}
      >
        {isConnected ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <MicrophoneIcon className="h-10 w-10 text-white" />
        )}
        
        {/* Animated rings for different states */}
        {isConnected && !isTalking && (
          <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-pulse" />
        )}
        {isTalking && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-75" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-25" style={{ animationDelay: '1s' }} />
          </div>
        )}
      </button>
      
      <div className="h-8 mt-4 flex items-center justify-center">
        <span className={`text-sm font-medium transition-all duration-300 ${
          isConnected 
            ? 'text-red-600' 
            : isConnecting 
              ? 'text-yellow-600'
              : 'text-blue-600'
        }`}>
          {isConnected 
            ? 'Click to disconnect' 
            : isConnecting 
              ? 'Establishing connection...' 
              : 'Click to connect'}
        </span>
      </div>
    </div>
  );
}); 