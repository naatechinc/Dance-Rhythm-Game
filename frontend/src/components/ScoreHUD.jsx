import React from 'react';

export default function ScoreHUD({ score, currentTime }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem 1rem',
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
      pointerEvents: 'none',
    }}>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
          {score.total.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
          Score
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-warning, #ffd600)' }}>
          x{score.combo}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
          Combo
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
          {formatTime(currentTime)}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
          Time
        </div>
      </div>
    </div>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return `${m}:${s}`;
}
