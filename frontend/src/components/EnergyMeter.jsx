import React, { useEffect, useRef } from 'react';

/**
 * EnergyMeter
 * A visual hype/energy bar that fills based on combo streak.
 * Flashes at full energy. Drains on misses.
 *
 * Props:
 *   energy: number  0–100
 *   maxEnergy: number  (default 100)
 */
export default function EnergyMeter({ energy = 0, maxEnergy = 100 }) {
  const pct = Math.min(100, Math.max(0, (energy / maxEnergy) * 100));
  const isFull = pct >= 100;

  const barColor = isFull
    ? 'linear-gradient(90deg, #ffd600, #ff6d00)'
    : pct > 60
    ? 'linear-gradient(90deg, #00e676, #00bcd4)'
    : pct > 30
    ? 'linear-gradient(90deg, #40c4ff, #7c4dff)'
    : 'linear-gradient(90deg, #e94560, #7c4dff)';

  return (
    <div style={{ width: '100%', padding: '0 1rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.3rem',
      }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {isFull ? '🔥 HYPE!' : 'Energy'}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          {Math.round(pct)}%
        </span>
      </div>

      {/* Track */}
      <div style={{
        width: '100%',
        height: 10,
        background: '#1a1a2e',
        borderRadius: 5,
        overflow: 'hidden',
        border: '1px solid #2a2a3a',
      }}>
        {/* Fill */}
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: barColor,
          borderRadius: 5,
          transition: 'width 0.2s ease, background 0.3s ease',
          boxShadow: isFull ? '0 0 8px #ffd60088' : 'none',
          animation: isFull ? 'pulse 0.4s ease-in-out infinite alternate' : 'none',
        }} />
      </div>

      <style>{`
        @keyframes pulse {
          from { opacity: 0.85; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
