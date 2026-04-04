import React from 'react';

export default function ErrorBanner({ message, onDismiss }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      background: 'rgba(255, 82, 82, 0.15)',
      border: '1px solid var(--color-error, #ff5252)',
      borderRadius: 'var(--radius)',
      color: 'var(--color-error, #ff5252)',
      marginBottom: '1rem',
      fontSize: '0.9rem',
    }}>
      <span>⚠️ {message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
