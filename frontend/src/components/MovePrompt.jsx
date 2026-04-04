import React from 'react';

const MOVE_ICONS = {
  step_left: '⬅️',
  step_right: '➡️',
  arm_cross: '🤝',
  arm_swing: '💪',
  spin: '🌀',
  bounce: '⬆️',
  clap: '👏',
  point: '👆',
  default: '🕺',
};

export default function MovePrompt({ move, targetTime, currentTime }) {
  const delta = targetTime - currentTime;
  const urgency = delta <= 0.3 ? 'high' : delta <= 0.8 ? 'medium' : 'low';

  const bgColors = {
    high: 'var(--color-accent)',
    medium: '#ff9800',
    low: 'var(--color-accent-2)',
  };

  const icon = MOVE_ICONS[move] ?? MOVE_ICONS.default;
  const label = move.replace(/_/g, ' ').toUpperCase();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius)',
      background: bgColors[urgency],
      transition: 'background 0.2s ease',
      fontWeight: 700,
      fontSize: '1.1rem',
    }}>
      <span style={{ fontSize: '1.8rem' }}>{icon}</span>
      <span>{label}</span>
      {urgency === 'high' && (
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.8 }}>NOW!</span>
      )}
    </div>
  );
}
