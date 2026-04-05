import React, { useEffect, useRef, useState } from 'react';

/**
 * AudioVisualizer
 * Real-time audio visualization using Web Audio API.
 * Analyzes the YouTube video's audio and renders a Freebeat-style
 * waveform/frequency visualization as a canvas background.
 *
 * Props:
 *   active: bool — whether to try connecting to audio
 *   width: number
 *   height: number
 *   color: string — primary glow color
 */
export default function AudioVisualizer({ active = false, width = 960, height = 480, color = '#00ff88' }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const analyserRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!active) return;
    tryConnect();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active]);

  function tryConnect() {
    // Try to tap into the YouTube iframe's audio
    // This uses a shared AudioContext with a MediaElementSource
    try {
      const iframes = document.querySelectorAll('iframe');
      let videoEl = null;

      // Try to find any audio/video element
      const allMedia = document.querySelectorAll('audio, video');
      if (allMedia.length > 0) videoEl = allMedia[0];

      if (videoEl) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const source = ctx.createMediaElementSource(videoEl);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;
        setConnected(true);
        draw();
        return;
      }
    } catch (e) {
      // Cross-origin YouTube iframe blocks direct audio access — use simulation
    }

    // Fallback: simulate audio visualization with animated sine waves
    setConnected(false);
    drawSimulated();
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function frame() {
      animRef.current = requestAnimationFrame(frame);
      analyser.getByteFrequencyData(dataArray);
      renderFrame(ctx, dataArray, bufferLength, canvas.width, canvas.height);
    }
    frame();
  }

  function drawSimulated() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;

    function frame() {
      animRef.current = requestAnimationFrame(frame);
      t += 0.03;

      // Simulate frequency data with animated sine waves
      const bufferLength = 128;
      const dataArray = new Uint8Array(bufferLength);
      for (let i = 0; i < bufferLength; i++) {
        const freq = i / bufferLength;
        // Bass frequencies (low i) pulse strong
        const bass = i < 10 ? Math.sin(t * 2.5) * 0.5 + 0.5 : 0;
        const mid = Math.sin(t * 1.5 + i * 0.3) * 0.4 + 0.4;
        const high = i > 80 ? Math.sin(t * 3 + i * 0.1) * 0.2 + 0.2 : 0;
        dataArray[i] = Math.min(255, (bass * 200 + mid * 120 + high * 80) * (1 - freq * 0.5));
      }
      renderFrame(ctx, dataArray, bufferLength, canvas.width, canvas.height);
    }
    frame();
  }

  function renderFrame(ctx, dataArray, bufferLength, W, H) {
    // Clear
    ctx.fillStyle = 'rgba(4, 4, 20, 0.85)';
    ctx.fillRect(0, 0, W, H);

    const barWidth = (W / bufferLength) * 2.2;
    const centerY = H * 0.65;

    // Parse color to RGB for glow effects
    const r = color === '#00ff88' ? 0 : color === '#ff0066' ? 255 : 64;
    const g = color === '#00ff88' ? 255 : color === '#ff0066' ? 0 : 196;
    const b = color === '#00ff88' ? 136 : color === '#ff0066' ? 102 : 255;

    // Draw frequency bars (mirrored, center)
    for (let i = 0; i < bufferLength; i++) {
      const val = dataArray[i] / 255;
      const barH = val * H * 0.45;
      const x = i * (barWidth + 1);
      const alpha = 0.3 + val * 0.7;

      // Gradient bar - teal/green glow
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`;
      ctx.fillRect(x, centerY - barH, barWidth, barH);

      // Mirrored below
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.25})`;
      ctx.fillRect(x, centerY, barWidth, barH * 0.4);

      // Bright cap on top
      if (val > 0.5) {
        ctx.fillStyle = `rgba(${Math.min(255, r + 100)}, ${Math.min(255, g + 100)}, ${Math.min(255, b + 100)}, ${val})`;
        ctx.fillRect(x, centerY - barH - 2, barWidth, 2);
      }
    }

    // Draw waveform line on top
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;

    for (let i = 0; i < bufferLength; i++) {
      const val = dataArray[i] / 255;
      const x = i * (barWidth + 1) + barWidth / 2;
      const y = centerY - val * H * 0.45;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center reflection line
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(W, centerY);
    ctx.stroke();

    // Horizontal scan line effect
    const scanY = (Date.now() % 4000) / 4000 * H;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.06)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(W, scanY);
    ctx.stroke();
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
