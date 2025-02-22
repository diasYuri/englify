'use client';

import { useState, useRef, useEffect } from 'react';
import { IconPlayerPlay, IconPlayerPause, IconLoader2 } from '@tabler/icons-react';

interface AudioPlayerProps {
  text: string;
}

export function AudioPlayer({ text }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (audioUrl) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Create and play audio
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <button
      onClick={handlePlay}
      disabled={isLoading}
      className={`p-2 rounded-full transition-colors ${
        isPlaying
          ? 'bg-primary-100 text-primary-600'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isPlaying ? 'Pause' : 'Play'}
    >
      {isLoading ? (
        <IconLoader2 size={20} className="animate-spin" />
      ) : isPlaying ? (
        <IconPlayerPause size={20} />
      ) : (
        <IconPlayerPlay size={20} />
      )}
    </button>
  );
} 