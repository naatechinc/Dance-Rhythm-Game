import React from 'react';
import StickFigure from './StickFigure';

/**
 * MoveTimeline
 * Just Dance style bottom-right move preview.
 * Shows current move (large, bright) + next 2 upcoming (smaller, faded).
 * Below each figure is the move name.
 */
export default function MoveTimeline({ moves = [], currentTime = 0, playerColor = '#e94560', startSec = 30, endSec = 72, totalDuration = 180 }) {

  // Find current + next 3 moves
  const upcoming = moves
    .filter(m => m.time >= currentTime - 0.3)
    .slice(0, 4);

  const current = upcoming[0] || null;
  const next = upcoming.slice(1, 4);

  // Segment progress 0-1
  const progress = Math.min(1, Math.max(0, (currentTime - startSec) / Math.max(1, endSec - startSec)));

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = String(Math.floor(sec % 60)).padStart(2, '0');
    return `${m}:${s}`;
  }

  return (
    <div style={{
      width: '100%',
      background: 'rgba(0,0,0,0.82)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      padding: '10px 16px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, color: '#555', minWidth: 32, textAlign: 'right' }}>
          {formatTime(currentTime)}
        </span>
        <div style={{ flex: 1, height: 4, background: '#1a1a1a', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${playerColor}88, ${playerColor})`,
            borderRadius: 99,
            transition: 'width 0.1s linear',
          }} />
        </div>
        <span style={{ fontSize: 10, color: '#555', minWidth: 32 }}>
          {formatTime(endSec)}
        </span>
      </div>

      {/* Move figures row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        gap: 12,
        paddingRight: 4,
      }}>

        {/* Next 2 upcoming — shown left, faded, small */}
        {[...next].reverse().map((m, i) => (
          <div key={`next-${i}`} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            opacity: 0.3 + (i * 0.2),
          }}>
            <StickFigure move={m.move} color={playerColor} size={36} ghost={true} />
            <span style={{ fontSize: 8, color: playerColor, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {m.move.replace(/_/g, ' ')}
            </span>
            <span style={{ fontSize: 7, color: '#555' }}>+{Math.round(m.time - currentTime)}s</span>
          </div>
        ))}

        {/* Divider arrow */}
        {next.length > 0 && (
          <div style={{ color: playerColor, fontSize: 18, opacity: 0.5, paddingBottom: 18 }}>›</div>
        )}

        {/* Current move — large and bright */}
        {current && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            filter: `drop-shadow(0 0 8px ${playerColor}88)`,
          }}>
            <StickFigure move={current.move} color={playerColor} size={64} />
            <span style={{
              fontSize: 10, color: playerColor, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {current.move.replace(/_/g, ' ')}
            </span>
            <span style={{ fontSize: 8, color: '#888' }}>NOW</span>
          </div>
        )}

        {!current && (
          <div style={{ color: '#333', fontSize: 11, paddingBottom: 20 }}>waiting...</div>
        )}
      </div>
    </div>
  );
}
