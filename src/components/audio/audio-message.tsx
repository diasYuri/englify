'use client';

import { useEffect, useRef, useState } from 'react';
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop } from '@tabler/icons-react';

interface AudioMessageProps {
  audioUrl: string;
  transcription: string;
  autoPlay?: boolean;
}

export function AudioMessage({ audioUrl, transcription, autoPlay = false }: AudioMessageProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, [autoPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="space-y-2">
      <div className="bg-primary-50/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlayPause}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <IconPlayerPause size={20} className="text-primary-600" />
            ) : (
              <IconPlayerPlay size={20} className="text-primary-600" />
            )}
          </button>
          <button
            onClick={handleStop}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            title="Stop"
          >
            <IconPlayerStop size={20} className="text-primary-600" />
          </button>
          <div className="flex-1 h-1 bg-primary-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      </div>
      <p className="text-gray-700 text-sm">{transcription}</p>
    </div>
  );
}
