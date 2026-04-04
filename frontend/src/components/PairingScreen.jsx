import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * PairingScreen
 * Shows QR code and short code for phone controller pairing.
 * Uses a canvas-based QR generator (no external library needed).
 */
export default function PairingScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [joinUrl, setJoinUrl] = useState('');
  const [qrLoaded, setQrLoaded] = useState(false);
  const canvasRef = React.useRef(null);

  const shortCode = sessionId?.toUpperCase().slice(0, 6) || '------';

  useEffect(() => {
    const base = window.location.origin;
    const url = `${base}/controller/${sessionId}`;
    setJoinUrl(url);

    // Load QR code library and render
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => {
      if (canvasRef.current && window.QRCode) {
        canvasRef.current.innerHTML = '';
        new window.QRCode(canvasRef.current, {
          text: url,
          width: 200,
          height: 200,
          colorDark: '#ffffff',
          colorLight: '#0d0d1a',
          correctLevel: window.QRCode.CorrectLevel.M,
        });
        setQrLoaded(true);
      }
    };
    document.head.appendChild(script);
  }, [sessionId]);

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', padding: '2rem 1rem',
      textAlign: 'center', minHeight: '100vh',
      background: '#0d0d1a', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '1.5rem',
    }}>

      <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>
        📱 Connect Your Phone
      </h2>
      <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
        Scan the QR code or enter the code on your phone's browser to use it as a motion controller.
      </p>

      {/* QR Code */}
      <div style={{
        padding: 16,
        background: '#0d0d1a',
        borderRadius: 12,
        border: '2px solid #e94560',
        display: 'inline-block',
      }}>
        <div ref={canvasRef} style={{ width: 200, height: 200 }} />
        {!qrLoaded && (
          <div style={{
            width: 200, height: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#444', fontSize: 13,
          }}>
            Generating QR...
          </div>
        )}
      </div>

      {/* Short code */}
      <div>
        <div style={{
          fontFamily: 'monospace', fontSize: '2rem', letterSpacing: '0.3em',
          color: '#e94560', fontWeight: 800, marginBottom: 8,
        }}>
          {shortCode}
        </div>
        <p style={{ fontSize: '0.8rem', color: '#555', margin: 0 }}>
          Enter this code at your Vercel URL + /controller/
        </p>
      </div>

      {/* URL */}
      <div style={{
        background: '#111', borderRadius: 8, padding: '10px 16px',
        fontSize: '0.75rem', color: '#666', wordBreak: 'break-all',
        border: '1px solid #222', maxWidth: 360,
      }}>
        {joinUrl}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigator.clipboard?.writeText(joinUrl)}
          style={{ padding: '0.6rem 1.2rem', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#aaa', cursor: 'pointer' }}>
          Copy Link
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '0.6rem 1.2rem', borderRadius: 8, border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Back to Game
        </button>
      </div>
    </div>
  );
}
