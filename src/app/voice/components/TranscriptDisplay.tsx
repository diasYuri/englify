'use client';

import { memo } from 'react';

interface TranscriptDisplayProps {
  text: string;
}

// Memoize the component
export const TranscriptDisplay = memo(function TranscriptDisplay({ text }: TranscriptDisplayProps) {
  if (!text) return null;
  
  return (
    <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm max-w-md animate-pulse">
      {text}
    </div>
  );
}); 