'use client';

import { useEffect, useRef } from 'react';

interface AudioMessageProps {
  transcription: string;
}

export function AudioMessage({ transcription }: AudioMessageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set wave style
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#818cf8');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Draw a more natural-looking waveform
    const points = 100;
    const segments = 3; // Number of wave segments
    const baseAmplitude = canvas.height / 4;
    
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);

    let prevY = canvas.height / 2;

    for (let i = 0; i <= points; i++) {
      const x = (canvas.width / points) * i;
      let y = canvas.height / 2;

      // Combine multiple sine waves with different frequencies and amplitudes
      for (let s = 1; s <= segments; s++) {
        const frequency = (s * Math.PI * 2) / points;
        const amplitude = baseAmplitude / (s * 1.5);
        y += Math.sin(i * frequency + (s * Math.PI) / 4) * amplitude;
      }

      // Add some random variation for a more natural look
      const variation = Math.random() * 2 - 1;
      y += variation * (baseAmplitude / 8);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // Use quadratic curves for smoother lines
        const prevX = (canvas.width / points) * (i - 1);
        const cpX = (x + prevX) / 2;
        ctx.quadraticCurveTo(cpX, prevY, x, y);
      }
      prevY = y;
    }

    // Apply a subtle shadow
    ctx.shadowColor = 'rgba(99, 102, 241, 0.2)';
    ctx.shadowBlur = 5;
    ctx.stroke();

    // Add a subtle gradient overlay
    const overlay = ctx.createLinearGradient(0, 0, 0, canvas.height);
    overlay.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    overlay.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    overlay.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="space-y-2">
      <div className="bg-primary-50/50 rounded-xl p-4">
        <canvas
          ref={canvasRef}
          width={300}
          height={40}
          className="w-full"
        />
      </div>
      <p className="text-gray-700 text-sm">{transcription}</p>
    </div>
  );
} 