import React, { useEffect, useRef } from 'react';

/**
 * AudioVisualizer
 * Freebeat-style audio visualization.
 * Uses Web Audio API if available, otherwise simulates with
 * realistic beat-synced animation using BPM timing.
 */
export default function AudioVisualizer({ active = false, width = 960, height = 480, color = '#00ff88', bpm = 120 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Try to tap real audio from YouTube video element
    let analyser = null;
    let audioCtx = null;

    const videoEls = document.querySelectorAll('video, audio');
    if (videoEls.length > 0) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(videoEls[0]);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
      } catch (e) {
        analyser = null;
      }
    }

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const beatMs = (60 / bpm) * 1000;
    let startTime = performance.now();

    // Parse color
    let r = 0, g = 255, b = 136;
    if (color === '#ff0066') { r = 255; g = 0; b = 102; }
    else if (color === '#40c4ff') { r = 64; g = 196; b = 255; }

    function getBeatPhase(now) {
      const elapsed = now - startTime;
      return (elapsed % beatMs) / beatMs; // 0-1 within beat
    }

    function getBeatEnergy(phase) {
      // Sharp attack (0-0.08), quick decay (0.08-0.4), long tail (0.4-1)
      if (phase < 0.08) return 1 - (phase / 0.08) * 0.3; // 1.0 → 0.7
      if (phase < 0.4)  return 0.7 - ((phase - 0.08) / 0.32) * 0.5; // 0.7 → 0.2
      return 0.2 - ((phase - 0.4) / 0.6) * 0.15; // 0.2 → 0.05
    }

    function drawFrame() {
      animRef.current = requestAnimationFrame(drawFrame);
      const now = performance.now();
      const beatPhase = getBeatPhase(now);
      const beatEnergy = getBeatEnergy(beatPhase);
      const t = now / 1000;

      let freqData = null;
      let bufLen = 256;

      if (analyser) {
        bufLen = analyser.frequencyBinCount;
        freqData = new Uint8Array(bufLen);
        analyser.getByteFrequencyData(freqData);
      }

      // Clear with motion blur effect
      ctx.fillStyle = `rgba(2, 8, 22, 0.82)`;
      ctx.fillRect(0, 0, W, H);

      // Grid lines (subtle)
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.05)`;
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < W; gx += 60) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += 50) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      const numBars = 64;
      const barW = W / numBars - 1;
      const centerY = H * 0.62;

      for (let i = 0; i < numBars; i++) {
        const freq = i / numBars;

        let val;
        if (freqData) {
          // Real audio data
          const idx = Math.floor(freq * bufLen * 0.7);
          val = freqData[idx] / 255;
        } else {
          // Simulated — bass heavy, beat-synced
          const isBass = i < 8;
          const isMid = i >= 8 && i < 24;
          const isHigh = i >= 24;

          const bassVal = isBass ? beatEnergy * (0.7 + Math.sin(t * 2.1 + i) * 0.3) : 0;
          const midVal = isMid ? (beatEnergy * 0.6 + Math.sin(t * 3.7 + i * 0.5) * 0.25) * (0.5 + beatEnergy * 0.5) : 0;
          const highVal = isHigh ? Math.max(0, Math.sin(t * 5.3 + i * 0.3) * 0.3 * beatEnergy) : 0;

          val = Math.max(0, Math.min(1, bassVal + midVal + highVal));
        }

        const barH = val * H * 0.5;
        const x = i * (barW + 1);
        const alpha = 0.25 + val * 0.75;

        // Main bar
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`;
        ctx.fillRect(x, centerY - barH, barW, barH);

        // Mirror below (shorter)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.2})`;
        ctx.fillRect(x, centerY, barW, barH * 0.35);

        // Bright cap
        if (val > 0.4) {
          ctx.fillStyle = `rgba(${Math.min(255,r+120)}, ${Math.min(255,g+80)}, ${Math.min(255,b+60)}, ${val})`;
          ctx.fillRect(x, centerY - barH - 2, barW, 2);
        }
      }

      // Main waveform line
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.95)`;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;

      for (let i = 0; i <= numBars; i++) {
        const freq = i / numBars;
        let val;
        if (freqData) {
          const idx = Math.floor(freq * bufLen * 0.7);
          val = freqData[idx] / 255;
        } else {
          val = Math.max(0, Math.sin(t * 4 + freq * Math.PI * 4) * 0.4 * beatEnergy
            + Math.sin(t * 7 + freq * Math.PI * 8) * 0.2 * beatEnergy
            + beatEnergy * 0.15 * Math.sin(freq * Math.PI));
        }
        const x = freq * W;
        const y = centerY - val * H * 0.5;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Secondary wave (offset phase)
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= numBars; i++) {
        const freq = i / numBars;
        const val = Math.sin(t * 3 + freq * Math.PI * 6 + Math.PI) * 0.2 * beatEnergy;
        const x = freq * W;
        const y = centerY - val * H * 0.3;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Center line
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.12)`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(W, centerY); ctx.stroke();

      // Beat flash on kick
      if (beatPhase < 0.12) {
        const flashAlpha = (1 - beatPhase / 0.12) * 0.08;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${flashAlpha})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    drawFrame();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (audioCtx) audioCtx.close().catch(() => {});
    };
  }, [active, bpm, color]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
