import React from 'react';
import StickFigure from './StickFigure';

/**
 * MoveFigureRow
 * Shows current move (center, full size) + next 2 (right, smaller/faded).
 * Current figure disappears when the move window passes.
 *
 * Props:
 *   moves: MoveEvent[]
 *   currentTime: number
 *   color: string
 */
export default function MoveFigureRow({ moves = [], currentTime = 0, color = '#e94560' }) {
  const WINDOW = 1.5; // seconds a move is "current"

  // Current move — only show if within active window
  const current = moves.find(m => currentTime >= m.time - 0.2 && currentTime < m.time + WINDOW) || null;

  // Next 2 upcoming moves after current
  const upcoming = moves
    .filter(m => m.time > currentTime + 0.3)
    .slice(0, 2);

  if (!current && upcoming.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 24,
      padding: '12px 0 8px',
      pointerEvents: 'none',
    }}>

      {/* Current move — center, large, bright */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        opacity: current ? 1 : 0,
        transition: 'opacity 0.2s ease',
        filter: current ? `drop-shadow(0 0 12px ${color}99)` : 'none',
        minWidth: 90,
      }}>
        <StickFigure move={current?.move || 'default'} color={color} size={90} />
        <span style={{
          fontSize: 11, color, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          textAlign: 'center',
        }}>
          {current?.move?.replace(/_/g, ' ') || ''}
        </span>
        <span style={{ fontSize: 9, color: '#888', textTransform: 'uppercase' }}>now</span>
      </div>

      {/* Divider */}
      {upcoming.length > 0 && (
        <div style={{ color: '#333', fontSize: 22, paddingBottom: 28 }}>›</div>
      )}

      {/* Next 2 upcoming */}
      {upcoming.map((m, i) => {
        const secondsAway = Math.round(m.time - currentTime);
        const opacity = i === 0 ? 0.55 : 0.3;
        const size = i === 0 ? 60 : 44;
        return (
          <div key={`${m.time}-${i}`} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3,
            opacity,
          }}>
            <StickFigure move={m.move} color={color} size={size} ghost />
            <span style={{
              fontSize: i === 0 ? 10 : 8,
              color, opacity: 0.7,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              {m.move.replace(/_/g, ' ')}
            </span>
            <span style={{ fontSize: 8, color: '#555' }}>+{secondsAway}s</span>
          </div>
        );
      })}
    </div>
  );
}
