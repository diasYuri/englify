'use client';

import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  audioStream?: MediaStream;
  color?: string;
  height?: number;
}

export function AudioWaveform({ isRecording, audioStream, color = '#6366f1', height = 60 }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isRecording || !audioStream) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up audio analyzer
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(audioStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx || !analyser) return;

      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (canvas.height / 2);
        
        // Draw mirrored bars
        ctx.beginPath();
        ctx.moveTo(x, canvas.height / 2 + barHeight);
        ctx.lineTo(x, canvas.height / 2 - barHeight);
        ctx.stroke();

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContext.close();
    };
  }, [isRecording, audioStream, color]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={height}
      className="w-full rounded-lg"
    />
  );
} 