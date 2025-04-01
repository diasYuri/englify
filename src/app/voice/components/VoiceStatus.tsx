'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { VoiceStatusProps } from './types';

// Memoize the component
export const VoiceStatus = memo(function VoiceStatus({ isConnected, isConnecting }: VoiceStatusProps) {
  return (
    <div className="flex justify-center">
      <Badge 
        className={`px-4 py-1.5 flex items-center gap-2 font-normal transition-colors ${
          isConnected 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : isConnecting
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              : 'bg-transparent text-gray-800 border border-gray-200'
        }`}
      >
        <span 
          className={`inline-block w-2 h-2 rounded-full ${
            isConnected 
              ? 'bg-green-500 animate-pulse'
              : isConnecting
                ? 'bg-yellow-500'
                : 'bg-gray-400'
          }`}
        />
        {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Ready'}
      </Badge>
    </div>
  );
}); 