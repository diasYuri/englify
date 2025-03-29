'use client';

interface TranscriptDisplayProps {
  text: string;
}

export function TranscriptDisplay({ text }: TranscriptDisplayProps) {
  if (!text) return null;
  
  return (
    <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm max-w-md animate-pulse">
      {text}
    </div>
  );
} 