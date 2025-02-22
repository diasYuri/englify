'use client';

import { useState, useRef } from 'react';
import { IconMicrophone, IconPlayerStop, IconLoader2 } from '@tabler/icons-react';
import { AudioWaveform } from './AudioWaveform';

interface AudioRecorderProps {
  onTranscriptionComplete: (transcription: string) => void;
  isLoading: boolean;
}

export function AudioRecorder({ onTranscriptionComplete, isLoading }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setAudioStream(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
        setIsProcessing(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      onTranscriptionComplete(data.transcription);
    } catch (error) {
      console.error('Transcription error:', error);
    }
  };

  return (
    <div className="relative">
      {(isRecording || isProcessing) && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-3 min-w-[200px]">
          <div className="text-sm text-gray-500 mb-2 text-center">
            {isProcessing ? 'Processing audio...' : 'Recording...'}
          </div>
          {isRecording && audioStream && (
            <AudioWaveform
              isRecording={isRecording}
              audioStream={audioStream}
              color={isProcessing ? '#9CA3AF' : '#EF4444'}
              height={40}
            />
          )}
          {isProcessing && (
            <div className="flex justify-center">
              <IconLoader2 size={24} className="text-gray-400 animate-spin" />
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isLoading || isProcessing}
        className={`p-2 rounded-xl transition-colors ${
          isRecording
            ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isLoading || isProcessing ? (
          <IconLoader2 size={20} className="animate-spin" />
        ) : isRecording ? (
          <IconPlayerStop size={20} />
        ) : (
          <IconMicrophone size={20} />
        )}
      </button>
    </div>
  );
} 