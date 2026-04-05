import React, { useEffect, useRef } from 'react';

/**
 * AudioVisualizer
 * Spotify-data-driven music visualizer.
 * Uses BPM, energy, danceability from Spotify to drive mathematically
 * precise beat-synced animations. No microphone needed.
 *
 * Props:
 *   style: 'bars' | 'waveform' | 'circular' | 'particles' | 'matrix'
 *   bpm: number
 *   energy: number (0-1)
 *   danceability: number (0-1)
 *   moves: MoveEvent[] — choreo timestamps used as visual trigger points
 *   currentTime: number — playback time in seconds
 *   color: string
 */
export default function AudioVisualizer({
  style = 'bars',
  bpm = 120,
  energy = 0.7,
  danceability = 0.7,
  moves = [],
  currentTime = 0,
  color = '#00ff88',
  width = 960,
  height = 480,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Parse color to RGB
    let r = 0, g = 255, b = 136;
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      r = parseInt(hex.slice(0,2), 16);
      g = parseInt(hex.slice(2,4), 16);
      b = parseInt(hex.slice(4,6), 16);
    }

    const beatMs = (60 / Math.max(60, bpm)) * 1000;
    const startMs = performance.now();

    // Per-style state
    const state = stateRef.current;
    if (!state.particles) {
      state.particles = Array.from({ length: 120 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
        life: Math.random(), size: 2 + Math.random() * 4,
      }));
    }
    if (!state.matrix) {
      const cols = Math.floor(W / 18);
      state.matrix = Array.from({ length: cols }, () => Math.floor(Math.random() * H / 18));
    }
    if (!state.lastBeat) state.lastBeat = 0;
    if (!state.beatPulse) state.beatPulse = 0;

    function getBeatPhase(now) {
      return ((now - startMs) % beatMs) / beatMs;
    }

    function getBeatEnergy(phase) {
      if (phase < 0.06) return 1.0 - phase / 0.06 * 0.25;
      if (phase < 0.35) return 0.75 - ((phase - 0.06) / 0.29) * 0.55;
      return 0.2 - ((phase - 0.35) / 0.65) * 0.15;
    }

    // Generate frequency-like data from Spotify params
    function getSimFreq(i, total, t, beatE) {
      const freq = i / total;
      const isBass = freq < 0.12;
      const isMid = freq >= 0.12 && freq < 0.5;
      const isHigh = freq >= 0.5;
      const bass = isBass ? beatE * energy * (0.8 + Math.sin(t * 2.1 + i) * 0.2) : 0;
      const mid  = isMid  ? (beatE * 0.55 + Math.sin(t * 3.7 + i * 0.4) * 0.25) * energy * danceability : 0;
      const high = isHigh ? Math.max(0, Math.sin(t * 6.3 + i * 0.2) * 0.25 * beatE * danceability) : 0;
      return Math.min(1, Math.max(0, bass + mid + high));
    }

    function draw() {
      animRef.current = requestAnimationFrame(draw);
      const now = performance.now();
      const t = now / 1000;
      const phase = getBeatPhase(now);
      const beatE = getBeatEnergy(phase);
      const N = 64;

      // Detect beat
      if (phase < 0.05 && state.lastBeat !== Math.floor((now - startMs) / beatMs)) {
        state.lastBeat = Math.floor((now - startMs) / beatMs);
        state.beatPulse = 1.0;
      }
      state.beatPulse = Math.max(0, (state.beatPulse || 0) - 0.04);

      if (style === 'bars') drawBars(ctx, W, H, t, beatE, N, r, g, b, state);
      else if (style === 'waveform') drawWaveform(ctx, W, H, t, beatE, r, g, b, state);
      else if (style === 'circular') drawCircular(ctx, W, H, t, beatE, N, r, g, b, state);
      else if (style === 'particles') drawParticles(ctx, W, H, t, beatE, r, g, b, state, energy, danceability);
      else if (style === 'matrix') drawMatrix(ctx, W, H, t, beatE, r, g, b, state, danceability);
    }

    function getFreq(i, t, beatE) { return getSimFreq(i, N, t, beatE); }
    const N = 64;

    // ── BARS ────────────────────────────────────────────────────────────────
    function drawBars(ctx, W, H, t, beatE, N, r, g, b, state) {
      ctx.fillStyle = `rgba(2, 8, 18, 0.85)`;
      ctx.fillRect(0, 0, W, H);
      // Grid
      ctx.strokeStyle = `rgba(${r},${g},${b},0.04)`;
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      const barW = (W / N) - 1;
      const cY = H * 0.65;
      for (let i = 0; i < N; i++) {
        const v = getSimFreq(i, N, t, beatE);
        const bH = v * H * 0.55;
        const x = i * (barW + 1);
        const alpha = 0.3 + v * 0.7;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.65})`;
        ctx.fillRect(x, cY - bH, barW, bH);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.18})`;
        ctx.fillRect(x, cY, barW, bH * 0.3);
        if (v > 0.45) {
          ctx.fillStyle = `rgba(${Math.min(255,r+100)},${Math.min(255,g+80)},${Math.min(255,b+60)},${v})`;
          ctx.fillRect(x, cY - bH - 2, barW, 2);
        }
      }
      // Waveform line on top
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.lineWidth = 2; ctx.shadowBlur = 12; ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
      for (let i = 0; i <= N; i++) {
        const v = getSimFreq(i, N, t, beatE);
        const x = (i / N) * W; const y = cY - v * H * 0.55;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.shadowBlur = 0;
      // Beat flash
      if (state.beatPulse > 0) {
        ctx.fillStyle = `rgba(${r},${g},${b},${state.beatPulse * 0.07})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    // ── WAVEFORM ─────────────────────────────────────────────────────────────
    function drawWaveform(ctx, W, H, t, beatE, r, g, b, state) {
      ctx.fillStyle = `rgba(2, 6, 20, 0.88)`;
      ctx.fillRect(0, 0, W, H);
      const cY = H / 2;
      const layers = [
        { amp: beatE * energy * 0.42 * H, freq: bpm/60 * 2, speed: 1.2, alpha: 0.9, lw: 3, blur: 16 },
        { amp: beatE * energy * 0.25 * H, freq: bpm/60 * 4, speed: 2.1, alpha: 0.5, lw: 1.5, blur: 6 },
        { amp: beatE * danceability * 0.15 * H, freq: bpm/60 * 8, speed: 3.3, alpha: 0.3, lw: 1, blur: 3 },
      ];
      layers.forEach(({ amp, freq, speed, alpha, lw, blur }) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = lw; ctx.shadowBlur = blur; ctx.shadowColor = `rgba(${r},${g},${b},0.7)`;
        for (let x = 0; x <= W; x += 2) {
          const fx = x / W;
          const y = cY + Math.sin(fx * Math.PI * 2 * freq + t * speed * Math.PI)
                       * amp * (0.6 + 0.4 * Math.sin(t * 1.1))
                       + Math.sin(fx * Math.PI * 6 + t * 4.7) * amp * 0.2 * beatE;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
      // Mirror waveform
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${r},${g},${b},0.15)`;
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 3) {
        const fx = x / W;
        const y = cY - Math.sin(fx * Math.PI * 2 * (bpm/60*2) + t * 1.2 * Math.PI) * beatE * energy * 0.42 * H;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Centerline
      ctx.strokeStyle = `rgba(${r},${g},${b},0.1)`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, cY); ctx.lineTo(W, cY); ctx.stroke();
      if (state.beatPulse > 0) {
        ctx.fillStyle = `rgba(${r},${g},${b},${state.beatPulse * 0.09})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    // ── CIRCULAR ─────────────────────────────────────────────────────────────
    function drawCircular(ctx, W, H, t, beatE, N, r, g, b, state) {
      ctx.fillStyle = `rgba(2, 4, 16, 0.88)`;
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const baseR = Math.min(W, H) * 0.22;
      const pulse = baseR * (1 + beatE * energy * 0.35);

      // Rotating outer rings
      [1.6, 1.3, 1.0].forEach((scale, ri) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.06 - ri * 0.01})`;
        ctx.lineWidth = 1;
        ctx.arc(cx, cy, pulse * scale + Math.sin(t + ri) * 5, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Frequency bars radiating outward
      const bars = N * 2;
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const v = getSimFreq(i % N, N, t, beatE);
        const inner = pulse * 0.85;
        const outer = inner + v * baseR * 1.2;
        const alpha = 0.3 + v * 0.7;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = (W / bars) * 0.7;
        ctx.shadowBlur = v > 0.5 ? 10 : 0;
        ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
        ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
        ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Center rotating shape
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.8 * (bpm / 120));
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.5 + beatE * 0.5})`;
      ctx.lineWidth = 2;
      const pts = 6;
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const rad = baseR * 0.3 * (1 + beatE * 0.4);
        i === 0 ? ctx.moveTo(Math.cos(a)*rad, Math.sin(a)*rad) : ctx.lineTo(Math.cos(a)*rad, Math.sin(a)*rad);
      }
      ctx.closePath(); ctx.stroke(); ctx.restore();

      if (state.beatPulse > 0) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${r},${g},${b},${state.beatPulse * 0.6})`;
        ctx.lineWidth = 3;
        ctx.arc(cx, cy, pulse * 1.65 + state.beatPulse * 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // ── PARTICLES ────────────────────────────────────────────────────────────
    function drawParticles(ctx, W, H, t, beatE, r, g, b, state, energy, danceability) {
      ctx.fillStyle = `rgba(2, 4, 16, 0.82)`;
      ctx.fillRect(0, 0, W, H);
      const speed = energy * danceability * beatE;
      state.particles.forEach(p => {
        p.x += p.vx * (1 + speed * 3);
        p.y += p.vy * (1 + speed * 3);
        p.life -= 0.008 + speed * 0.015;
        if (p.life <= 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = W / 2 + (Math.random() - 0.5) * W * 0.6;
          p.y = H / 2 + (Math.random() - 0.5) * H * 0.5;
          p.vx = (Math.random() - 0.5) * 3 * energy;
          p.vy = (Math.random() - 0.5) * 3 * energy - beatE;
          p.life = 0.6 + Math.random() * 0.4;
          p.size = 2 + Math.random() * 5 * energy;
        }
        const alpha = p.life * (0.4 + beatE * 0.6);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.shadowBlur = p.size * 2; ctx.shadowColor = `rgba(${r},${g},${b},0.5)`;
        ctx.arc(p.x, p.y, p.size * (0.5 + beatE * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      // On beat — burst
      if (state.beatPulse > 0.8) {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const p = state.particles[i];
          p.vx = Math.cos(angle) * 6 * energy;
          p.vy = Math.sin(angle) * 6 * energy;
          p.life = 1.0; p.size = 6 * energy;
        }
      }
    }

    // ── MATRIX ───────────────────────────────────────────────────────────────
    function drawMatrix(ctx, W, H, t, beatE, r, g, b, state, danceability) {
      ctx.fillStyle = `rgba(0, 4, 0, 0.88)`;
      ctx.fillRect(0, 0, W, H);
      const cols = state.matrix.length;
      const fontSize = 14;
      ctx.font = `${fontSize}px monospace`;
      const chars = '01アイウエオカキクケコサシスセソタチ♪♫★◆'.split('');
      state.matrix.forEach((y, i) => {
        const x = i * 18;
        const speed = (danceability * beatE * 0.8 + 0.2);
        const brightness = i % 4 === 0 ? 1 : 0.4 + beatE * 0.3;
        ctx.fillStyle = `rgba(${r},${g},${b},${brightness})`;
        if (i % 5 === 0) {
          ctx.fillStyle = `rgba(255,255,255,${0.6 + beatE * 0.4})`;
        }
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y * fontSize);
        if (y * fontSize > H && Math.random() > (0.98 - speed * 0.05)) {
          state.matrix[i] = 0;
        } else {
          state.matrix[i] += speed * 0.8;
        }
      });
      if (state.beatPulse > 0) {
        ctx.fillStyle = `rgba(${r},${g},${b},${state.beatPulse * 0.06})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [style, bpm, energy, danceability, color]);

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ width: '100%', height: '100%', display: 'block' }}/>
  );
}
