'use client';

import { Button } from '@/components/ui/button';
import { SpeakerWaveIcon } from '@heroicons/react/24/solid';

interface VoiceControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isTalking: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function VoiceControls({
  isConnected,
  isConnecting,
  isTalking,
  onConnect,
  onDisconnect
}: VoiceControlsProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-2">
        <SpeakerWaveIcon 
          className={`h-5 w-5 ${isTalking ? 'text-green-500' : 'text-gray-500'}`} 
        />
        <span className="text-sm">{isTalking ? 'AI speaking...' : 'AI idle'}</span>
      </div>
      
      {isConnected ? (
        <Button 
          variant="destructive" 
          onClick={onDisconnect}
          className="w-full"
        >
          Disconnect
        </Button>
      ) : (
        <Button 
          onClick={onConnect}
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </Button>
      )}
    </div>
  );
} 