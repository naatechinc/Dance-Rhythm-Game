import React, { useEffect, useRef } from 'react';

/**
 * AudioVisualizer
 * Driven by real YouTube currentTime + Spotify audio features.
 * - Freezes completely when isPlaying=false
 * - Uses currentTime as the audio clock so visuals are locked to playback position
 * - BPM, energy, danceability from Spotify determine visual character
 *
 * Props:
 *   vizStyle: 'bars'|'waveform'|'circular'|'particles'|'matrix'
 *   bpm, energy, danceability — from Spotify
 *   currentTime — YouTube playback position (seconds), drives beat phase
 *   isPlaying — freezes animation when false
 *   color, width, height
 */
export default function AudioVisualizer({
  vizStyle = 'bars',
  bpm = 120,
  energy = 0.7,
  danceability = 0.7,
  currentTime = 0,
  isPlaying = false,
  color = '#00ff88',
  width = 960,
  height = 480,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef({});
  // Store latest props in ref so animation loop always has current values
  const propsRef = useRef({});
  propsRef.current = { vizStyle, bpm, energy, danceability, currentTime, isPlaying, color };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Init per-style state once
    const state = stateRef.current;
    if (!state.inited) {
      state.inited = true;
      state.particles = Array.from({ length: 130 }, (_, i) => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: Math.random(), size: 2 + Math.random() * 4,
      }));
      const cols = Math.floor(W / 18);
      state.matrix = Array.from({ length: cols }, () => Math.floor(Math.random() * H / 14));
      state.beatPulse = 0;
      state.lastBeatIndex = -1;
      state.frozenCanvas = null;
    }

    function parseColor(hex) {
      const h = hex.replace('#', '');
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    }

    function getBeatPhase(timeSec, bpm) {
      const beatSec = 60 / Math.max(60, bpm);
      return (timeSec % beatSec) / beatSec;
    }

    function getBeatEnergy(phase) {
      if (phase < 0.07) return 1.0;
      if (phase < 0.35) return 1.0 - ((phase - 0.07) / 0.28) * 0.75;
      return 0.25 - ((phase - 0.35) / 0.65) * 0.2;
    }

    // Freq value derived from currentTime (deterministic for same time)
    function getFreq(i, total, timeSec, beatE, energy, danceability) {
      const freq = i / total;
      const seed = timeSec * 7.3 + i * 0.41;
      const isBass = freq < 0.12;
      const isMid  = freq >= 0.12 && freq < 0.5;
      const isHigh = freq >= 0.5;
      const bass = isBass ? beatE * energy * (0.75 + Math.sin(seed * 1.7) * 0.25) : 0;
      const mid  = isMid  ? (beatE * 0.55 + Math.sin(seed * 3.1) * 0.25) * energy * danceability : 0;
      const high = isHigh ? Math.max(0, Math.sin(seed * 5.7) * 0.25 * beatE * danceability) : 0;
      return Math.min(1, Math.max(0, bass + mid + high));
    }

    let lastDrawnTime = -1;

    function frame() {
      animRef.current = requestAnimationFrame(frame);
      const { vizStyle, bpm, energy, danceability, currentTime, isPlaying, color } = propsRef.current;

      // If paused, draw frozen frame once then stop updating
      if (!isPlaying) {
        if (lastDrawnTime !== -1) return; // already frozen
      }

      // Skip re-render if time hasn't changed (saves CPU)
      if (isPlaying && Math.abs(currentTime - lastDrawnTime) < 0.016) return;
      lastDrawnTime = isPlaying ? currentTime : -1;

      const [r, g, b] = parseColor(color);
      const phase = getBeatPhase(currentTime, bpm);
      const beatE = isPlaying ? getBeatEnergy(phase) : 0;
      const N = 64;

      // Beat pulse
      const beatIdx = Math.floor(currentTime * bpm / 60);
      if (beatIdx !== state.lastBeatIndex && isPlaying) {
        state.lastBeatIndex = beatIdx;
        state.beatPulse = 1.0;
      }
      state.beatPulse = Math.max(0, (state.beatPulse || 0) - 0.06);

      if (vizStyle === 'bars')         drawBars(ctx, W, H, currentTime, beatE, N, r, g, b);
      else if (vizStyle === 'waveform') drawWaveform(ctx, W, H, currentTime, beatE, r, g, b);
      else if (vizStyle === 'circular') drawCircular(ctx, W, H, currentTime, beatE, N, r, g, b);
      else if (vizStyle === 'particles')drawParticles(ctx, W, H, currentTime, beatE, r, g, b, isPlaying);
      else if (vizStyle === 'matrix')   drawMatrix(ctx, W, H, currentTime, beatE, r, g, b, isPlaying);
    }

    const { bpm: b0, energy: e0, danceability: d0 } = propsRef.current;
    const N = 64;

    function getF(i, t, beatE) {
      return getFreq(i, N, t, beatE, propsRef.current.energy, propsRef.current.danceability);
    }

    // ── BARS ─────────────────────────────────────────────────────────────────
    function drawBars(ctx, W, H, t, beatE, N, r, g, b) {
      ctx.fillStyle = 'rgba(2,8,18,0.88)'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.04)`; ctx.lineWidth = 0.5;
      for (let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for (let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      const barW = W/N - 1, cY = H*0.65;
      for (let i=0;i<N;i++) {
        const v = getF(i,t,beatE);
        const bH = v*H*0.55, x = i*(barW+1), alpha = 0.3+v*0.7;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha*0.65})`;
        ctx.fillRect(x,cY-bH,barW,bH);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha*0.18})`;
        ctx.fillRect(x,cY,barW,bH*0.3);
        if (v>0.45){ctx.fillStyle=`rgba(${Math.min(255,r+100)},${Math.min(255,g+80)},${Math.min(255,b+60)},${v})`;ctx.fillRect(x,cY-bH-2,barW,2);}
      }
      ctx.beginPath(); ctx.strokeStyle=`rgba(${r},${g},${b},0.9)`; ctx.lineWidth=2.5;
      ctx.shadowBlur=14; ctx.shadowColor=`rgba(${r},${g},${b},0.85)`;
      for (let i=0;i<=N;i++){const v=getF(i,t,beatE);const x=(i/N)*W;const y=cY-v*H*0.55;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.stroke(); ctx.shadowBlur=0;
      if (state.beatPulse>0){ctx.fillStyle=`rgba(${r},${g},${b},${state.beatPulse*0.08})`;ctx.fillRect(0,0,W,H);}
    }

    // ── WAVEFORM ──────────────────────────────────────────────────────────────
    function drawWaveform(ctx, W, H, t, beatE, r, g, b) {
      ctx.fillStyle = 'rgba(2,6,20,0.9)'; ctx.fillRect(0,0,W,H);
      const cY = H/2;
      const bpmV = propsRef.current.bpm;
      const eV = propsRef.current.energy;
      const dV = propsRef.current.danceability;
      const layers = [
        {amp:beatE*eV*0.42*H, freq:bpmV/60*2, phase:t*2.1, alpha:0.9, lw:3, blur:16},
        {amp:beatE*eV*0.24*H, freq:bpmV/60*4, phase:t*3.7+1, alpha:0.45, lw:1.5, blur:6},
        {amp:beatE*dV*0.14*H, freq:bpmV/60*8, phase:t*6.1+2, alpha:0.25, lw:1, blur:3},
      ];
      layers.forEach(({amp,freq,phase,alpha,lw,blur}) => {
        ctx.beginPath(); ctx.strokeStyle=`rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth=lw; ctx.shadowBlur=blur; ctx.shadowColor=`rgba(${r},${g},${b},0.7)`;
        for(let x=0;x<=W;x+=2){
          const fx=x/W;
          const y=cY+Math.sin(fx*Math.PI*2*freq+phase)*amp+Math.sin(fx*Math.PI*8+t*5.3)*amp*0.15*beatE;
          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.stroke();
      });
      ctx.shadowBlur=0;
      ctx.strokeStyle=`rgba(${r},${g},${b},0.1)`; ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,cY);ctx.lineTo(W,cY);ctx.stroke();
      if(state.beatPulse>0){ctx.fillStyle=`rgba(${r},${g},${b},${state.beatPulse*0.09})`;ctx.fillRect(0,0,W,H);}
    }

    // ── CIRCULAR ──────────────────────────────────────────────────────────────
    function drawCircular(ctx, W, H, t, beatE, N, r, g, b) {
      ctx.fillStyle='rgba(2,4,16,0.9)';ctx.fillRect(0,0,W,H);
      const cx=W/2,cy=H/2,baseR=Math.min(W,H)*0.22,pulse=baseR*(1+beatE*propsRef.current.energy*0.35);
      [1.7,1.35,1.0].forEach((s,ri)=>{
        ctx.beginPath();ctx.strokeStyle=`rgba(${r},${g},${b},${0.07-ri*0.015})`;
        ctx.lineWidth=1;ctx.arc(cx,cy,pulse*s,0,Math.PI*2);ctx.stroke();
      });
      const bars=N*2;
      for(let i=0;i<bars;i++){
        const angle=(i/bars)*Math.PI*2-Math.PI/2;
        const v=getF(i%N,t,beatE);
        const inner=pulse*0.85, outer=inner+v*baseR*1.3;
        ctx.beginPath();ctx.strokeStyle=`rgba(${r},${g},${b},${0.3+v*0.7})`;
        ctx.lineWidth=(W/bars)*0.7;ctx.shadowBlur=v>0.5?12:0;ctx.shadowColor=`rgba(${r},${g},${b},0.8)`;
        ctx.moveTo(cx+Math.cos(angle)*inner,cy+Math.sin(angle)*inner);
        ctx.lineTo(cx+Math.cos(angle)*outer,cy+Math.sin(angle)*outer);ctx.stroke();
      }
      ctx.shadowBlur=0;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(t*0.8*(propsRef.current.bpm/120));
      ctx.beginPath();ctx.strokeStyle=`rgba(${r},${g},${b},${0.5+beatE*0.5})`;ctx.lineWidth=2;
      const pts=6;
      for(let i=0;i<=pts;i++){const a=(i/pts)*Math.PI*2;const rad=baseR*0.28*(1+beatE*0.4);i===0?ctx.moveTo(Math.cos(a)*rad,Math.sin(a)*rad):ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}
      ctx.closePath();ctx.stroke();ctx.restore();
      if(state.beatPulse>0){ctx.beginPath();ctx.strokeStyle=`rgba(${r},${g},${b},${state.beatPulse*0.6})`;ctx.lineWidth=3;ctx.arc(cx,cy,pulse*1.7+state.beatPulse*18,0,Math.PI*2);ctx.stroke();}
    }

    // ── PARTICLES ─────────────────────────────────────────────────────────────
    function drawParticles(ctx, W, H, t, beatE, r, g, b, isPlaying) {
      ctx.fillStyle='rgba(2,4,16,0.84)';ctx.fillRect(0,0,W,H);
      if(!isPlaying){
        ctx.fillStyle=`rgba(${r},${g},${b},0.12)`;ctx.fillRect(0,0,W,H);
        state.particles.forEach(p=>{
          ctx.beginPath();ctx.fillStyle=`rgba(${r},${g},${b},${p.life*0.15})`;
          ctx.arc(p.x,p.y,p.size*0.5,0,Math.PI*2);ctx.fill();
        });
        return;
      }
      const eV=propsRef.current.energy,dV=propsRef.current.danceability;
      const speed=eV*dV*beatE;
      state.particles.forEach(p=>{
        p.x+=p.vx*(1+speed*3.5);p.y+=p.vy*(1+speed*3.5)-beatE*0.5;
        p.life-=0.008+speed*0.018;
        if(p.life<=0||p.x<0||p.x>W||p.y<0||p.y>H){
          p.x=W/2+(Math.random()-0.5)*W*0.5;p.y=H/2+(Math.random()-0.5)*H*0.4;
          p.vx=(Math.random()-0.5)*3*eV;p.vy=(Math.random()-0.5)*3*eV-beatE;
          p.life=0.6+Math.random()*0.4;p.size=2+Math.random()*5*eV;
        }
        const alpha=p.life*(0.4+beatE*0.6);
        ctx.beginPath();ctx.fillStyle=`rgba(${r},${g},${b},${alpha})`;
        ctx.shadowBlur=p.size*2;ctx.shadowColor=`rgba(${r},${g},${b},0.5)`;
        ctx.arc(p.x,p.y,p.size*(0.5+beatE*0.5),0,Math.PI*2);ctx.fill();
      });
      ctx.shadowBlur=0;
      if(state.beatPulse>0.8){for(let i=0;i<10;i++){const a=(i/10)*Math.PI*2;const p=state.particles[i];p.vx=Math.cos(a)*7*eV;p.vy=Math.sin(a)*7*eV;p.life=1.0;p.size=7*eV;}}
    }

    // ── MATRIX ────────────────────────────────────────────────────────────────
    function drawMatrix(ctx, W, H, t, beatE, r, g, b, isPlaying) {
      ctx.fillStyle='rgba(0,4,0,0.9)';ctx.fillRect(0,0,W,H);
      if(!isPlaying) return; // freeze on pause
      const dV=propsRef.current.danceability;
      const cols=state.matrix.length;
      const fontSize=14;ctx.font=`${fontSize}px monospace`;
      const chars='01アイウエオカキ♪♫★◆▲●■'.split('');
      state.matrix.forEach((y,i)=>{
        const x=i*18;
        const spd=dV*beatE*0.85+0.18;
        const bright=i%4===0?1:0.4+beatE*0.3;
        ctx.fillStyle=`rgba(${r},${g},${b},${bright})`;
        if(i%5===0) ctx.fillStyle=`rgba(255,255,255,${0.6+beatE*0.4})`;
        ctx.fillText(chars[Math.floor(Math.random()*chars.length)],x,y*fontSize);
        if(y*fontSize>H&&Math.random()>(0.975-spd*0.05)) state.matrix[i]=0;
        else state.matrix[i]+=spd*0.85;
      });
      if(state.beatPulse>0){ctx.fillStyle=`rgba(${r},${g},${b},${state.beatPulse*0.07})`;ctx.fillRect(0,0,W,H);}
    }

    frame();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []); // Only init once — reads from propsRef every frame

  return (
    <canvas ref={canvasRef} width={width} height={height}
      style={{ width:'100%', height:'100%', display:'block' }}/>
  );
}
