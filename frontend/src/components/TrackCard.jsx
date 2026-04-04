import React from 'react';

export default function TrackCard({ track, onSelect }) {
  const { title, artist, durationSec, thumbnail } = track;

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  return (
    <div
      onClick={() => onSelect(track)}
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '0.75rem',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        transition: 'filter var(--transition)',
        border: '1px solid transparent',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.border = '1px solid var(--color-accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.border = '1px solid transparent')}
    >
      {thumbnail && (
        <img
          src={thumbnail}
          alt={title}
          style={{ width: 90, height: 60, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </p>
        {artist && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{artist}</p>}
      </div>
      {durationSec && (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', alignSelf: 'center', flexShrink: 0 }}>
          {formatDuration(durationSec)}
        </span>
      )}
    </div>
  );
}
