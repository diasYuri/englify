'use client';

import { SpeakerWaveIcon } from '@heroicons/react/24/outline';

interface AudioMessageProps {
  transcription: string;
}

export function AudioMessage({ transcription }: AudioMessageProps) {
  return (
    <div className="flex items-start space-x-2 text-gray-700">
      <SpeakerWaveIcon className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
      <p className="text-sm">{transcription}</p>
    </div>
  );
} 