import React from 'react';

/**
 * VerticalScoreMeter
 * Just Dance style vertical score bar on the left side.
 * Fills from bottom up. Stars appear at thresholds.
 *
 * Props:
 *   score: number — current score
 *   maxScore: number — max possible score
 *   color: string — player color
 *   playerLabel: string — e.g. "P1"
 */

const STAR_THRESHOLDS = [0.33, 0.66, 1.0]; // 1, 2, 3 stars

export default function VerticalScoreMeter({ score = 0, maxScore = 10000, color = '#e94560', playerLabel = 'P1' }) {
  const pct = Math.min(1, score / maxScore);
  const stars = STAR_THRESHOLDS.filter(t => pct >= t).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      padding: '8px 4px',
    }}>
      {/* Player label */}
      <span style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: '0.1em' }}>
        {playerLabel}
      </span>

      {/* Stars above bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
        {[2, 1, 0].map(i => (
          <span key={i} style={{
            fontSize: 14,
            filter: stars > i
              ? `drop-shadow(0 0 4px ${color})`
              : 'none',
            opacity: stars > i ? 1 : 0.2,
            transition: 'all 0.3s ease',
          }}>
            ⭐
          </span>
        ))}
      </div>

      {/* Vertical bar */}
      <div style={{
        width: 18,
        height: 120,
        background: '#111',
        borderRadius: 9,
        overflow: 'hidden',
        border: `1px solid ${color}33`,
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
      }}>
        <div style={{
          width: '100%',
          height: `${pct * 100}%`,
          background: `linear-gradient(to top, ${color}, ${color}88)`,
          borderRadius: 9,
          transition: 'height 0.3s ease',
          boxShadow: pct > 0 ? `0 0 8px ${color}66` : 'none',
        }} />

        {/* Threshold markers */}
        {STAR_THRESHOLDS.map((t, i) => (
          <div key={i} style={{
            position: 'absolute',
            bottom: `${t * 100}%`,
            left: 0,
            right: 0,
            height: 1,
            background: `${color}44`,
          }} />
        ))}
      </div>

      {/* Score number */}
      <span style={{
        fontSize: 9,
        color: '#666',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'center',
      }}>
        {score.toLocaleString()}
      </span>
    </div>
  );
}
