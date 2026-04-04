import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function PairingScreen() {
  const { sessionId } = useParams();
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    const base = window.location.origin;
    setJoinUrl(`${base}/controller/${sessionId}`);
  }, [sessionId]);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1rem' }}>📱 Connect Your Phone</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        Scan the QR code or enter the code below to use your phone as a motion controller.
      </p>

      {/* QR placeholder — replace with a real QR library e.g. qrcode.react */}
      <div style={{
        width: 180, height: 180, margin: '0 auto 1.5rem',
        background: 'var(--color-surface)', borderRadius: 'var(--radius)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px dashed #444', color: 'var(--color-text-muted)', fontSize: '0.9rem'
      }}>
        QR Code Here
      </div>

      <p style={{ fontFamily: 'monospace', fontSize: '1.5rem', letterSpacing: '0.2em', marginBottom: '1rem' }}>
        {sessionId?.toUpperCase().slice(0, 6)}
      </p>

      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        Or open: <code style={{ color: 'var(--color-accent)' }}>{joinUrl}</code>
      </p>
    </div>
  );
}
