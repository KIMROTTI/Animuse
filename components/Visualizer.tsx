import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface VisualizerProps {
  isPlaying: boolean;
  moodColor: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying, moodColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const analyser = audioEngine.getAnalyser();
      if (!analyser) {
         animationRef.current = requestAnimationFrame(draw);
         return;
      }

      const values = analyser.getValue(); // Returns Float32Array of waveform
      
      ctx.fillStyle = '#0f172a'; // Background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!isPlaying && !values) return;

      ctx.lineWidth = 3;
      ctx.strokeStyle = moodColor;
      ctx.beginPath();

      const sliceWidth = canvas.width / values.length;
      let x = 0;

      for (let i = 0; i < values.length; i++) {
        // value is between -1 and 1
        const v = (values[i] as number); 
        const y = (v * (canvas.height / 3)) + (canvas.height / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Add a glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = moodColor;

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, moodColor]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-64 md:h-96 rounded-xl bg-slate-900 border border-slate-800 shadow-inner"
    />
  );
};

export default Visualizer;