'use client';

import { memo } from 'react';
import { IconRobot } from '@tabler/icons-react';
import { VoiceRobotProps } from './types';

// Memoize the component
export const VoiceRobot = memo(function VoiceRobot({ isConnected, isConnecting, isTalking }: VoiceRobotProps) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-24 h-24 mb-6 transition-opacity flex items-center justify-center ${isConnected ? 'opacity-100' : 'opacity-50'}`}>
        <IconRobot 
          size={64} 
          className={`${isConnected ? 'text-blue-500' : 'text-gray-400'} ${isTalking ? 'animate-bounce' : ''}`} 
        />
      </div>
      
      <h2 className="text-2xl font-semibold text-center mb-2">
        {isConnected 
          ? 'Voice Chat Active' 
          : isConnecting 
            ? 'Connecting...' 
            : 'Voice Assistant Ready'}
      </h2>
      <p className="text-center text-gray-600 mb-8">
        {isConnected 
          ? 'Speak now or click the button to disconnect'
          : isConnecting
            ? 'Please wait while we establish your connection...'
            : 'Start speaking by clicking the microphone button below.'}
      </p>
    </div>
  );
}); 