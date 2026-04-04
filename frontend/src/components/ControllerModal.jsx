import React, { useEffect, useRef, useState } from 'react';

/**
 * ControllerModal
 * Full-screen modal that appears on game load.
 * Shows QR code + short code for phone controller pairing.
 * Video is paused while this is open.
 * Dismissed by clicking "Start Game" or "Play Without Controller".
 *
 * Props:
 *   sessionId: string
 *   onDismiss: () => void
 */
export default function ControllerModal({ sessionId, onDismiss }) {
  const [joinUrl, setJoinUrl] = useState('');
  const [qrReady, setQrReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);
  const shortCode = sessionId?.toUpperCase().slice(0, 6) || '------';

  useEffect(() => {
    const base = window.location.origin;
    const url = `${base}/controller/${sessionId}`;
    setJoinUrl(url);

    // Load QRCode lib and render
    if (window.QRCode) {
      renderQR(url);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => renderQR(url);
    document.head.appendChild(script);
  }, [sessionId]);

  function renderQR(url) {
    if (!qrRef.current || !window.QRCode) return;
    qrRef.current.innerHTML = '';
    new window.QRCode(qrRef.current, {
      text: url,
      width: 180,
      height: 180,
      colorDark: '#ffffff',
      colorLight: '#111111',
      correctLevel: window.QRCode.CorrectLevel.M,
    });
    setQrReady(true);
  }

  function handleCopy() {
    navigator.clipboard?.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, padding: '1.5rem',
      backdropFilter: 'blur(6px)',
    }}>

      <h2 style={{ color: '#fff', fontSize: '1.4rem', margin: 0, textAlign: 'center' }}>
        📱 Connect Your Phone Controller
      </h2>
      <p style={{ color: '#888', fontSize: '0.85rem', margin: 0, textAlign: 'center', maxWidth: 300 }}>
        Scan the QR code on your phone to use it as a motion controller. You can also play without one.
      </p>

      {/* QR Code */}
      <div style={{
        padding: 16, background: '#111',
        borderRadius: 12, border: '2px solid #e94560',
      }}>
        <div ref={qrRef} style={{ width: 180, height: 180 }} />
        {!qrReady && (
          <div style={{
            width: 180, height: 180, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#444', fontSize: 12,
          }}>
            Generating QR...
          </div>
        )}
      </div>

      {/* Short code */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'monospace', fontSize: '1.8rem',
          letterSpacing: '0.3em', color: '#e94560',
          fontWeight: 800, marginBottom: 4,
        }}>
          {shortCode}
        </div>
        <p style={{ color: '#555', fontSize: '0.75rem', margin: 0 }}>
          Or open: <span style={{ color: '#777', wordBreak: 'break-all' }}>{joinUrl}</span>
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={handleCopy}
          style={{
            padding: '0.6rem 1.2rem', borderRadius: 8,
            border: '1px solid #333', background: '#111',
            color: '#aaa', cursor: 'pointer', fontSize: '0.9rem',
          }}>
          {copied ? '✓ Copied!' : 'Copy Link'}
        </button>
        <button onClick={onDismiss}
          style={{
            padding: '0.6rem 1.8rem', borderRadius: 8,
            border: 'none', background: '#e94560',
            color: '#fff', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.95rem',
          }}>
          Start Game ▶
        </button>
      </div>

      <button onClick={onDismiss}
        style={{
          background: 'none', border: 'none',
          color: '#444', cursor: 'pointer',
          fontSize: '0.8rem', textDecoration: 'underline',
        }}>
        Play without controller
      </button>
    </div>
  );
}
