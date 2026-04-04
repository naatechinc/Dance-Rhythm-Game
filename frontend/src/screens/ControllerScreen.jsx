import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useSocket from '../hooks/useSocket';
import useMotionController from '../hooks/useMotionController';

/**
 * ControllerScreen
 * Opened on the player's phone. Connects to the session as a controller,
 * requests device motion permission, and streams motion data to the server.
 * Also allows manual tap input as a fallback.
 */
export default function ControllerScreen() {
  const { sessionId } = useParams();
  const socket = useSocket(sessionId);
  const [status, setStatus] = useState('connecting'); // connecting | ready | error
  const [motionSupported, setMotionSupported] = useState(true);
  const [lastMove, setLastMove] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'perfect' | 'good' | 'okay' | 'miss'

  // Hook up motion controller
  useMotionController(socket, sessionId);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      socket.emit('session:join', { sessionId, role: 'controller' });
    });

    socket.on('session:joined', () => setStatus('ready'));
    socket.on('session:error', () => setStatus('error'));

    // Listen for scored result feedback
    socket.on('input:scored', ({ result }) => {
      setFeedback(result);
      setTimeout(() => setFeedback(null), 600);
    });

    // Check motion API availability
    if (typeof DeviceMotionEvent === 'undefined') {
      setMotionSupported(false);
    }

    return () => {
      socket.off('session:joined');
      socket.off('session:error');
      socket.off('input:scored');
    };
  }, [socket, sessionId]);

  // Manual tap fallback — submit a gesture via button press
  function handleManualInput(moveType) {
    if (!socket) return;
    setLastMove(moveType);
    socket.emit('input:submit', {
      sessionId,
      inputTimeSec: performance.now() / 1000,
      moveType,
    });
  }

  const feedbackColors = {
    perfect: '#ffd600',
    good: '#00e676',
    okay: '#40c4ff',
    miss: '#ff5252',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      userSelect: 'none',
    }}>

      {/* Status banner */}
      <div style={{
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
        color: status === 'ready' ? 'var(--color-success, #00e676)' : 'var(--color-text-muted)',
      }}>
        {status === 'connecting' && '⏳ Connecting to session…'}
        {status === 'ready' && '✅ Controller connected!'}
        {status === 'error' && '❌ Could not join session. Check your code and try again.'}
      </div>

      {/* Hit feedback flash */}
      {feedback && (
        <div style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '2.5rem',
          fontWeight: 900,
          color: feedbackColors[feedback] ?? '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          pointerEvents: 'none',
          animation: 'fadeUp 0.6s ease forwards',
        }}>
          {feedback}
          <style>{`
            @keyframes fadeUp {
              0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
              100% { opacity: 0; transform: translateX(-50%) translateY(-30px); }
            }
          `}</style>
        </div>
      )}

      {/* Motion active indicator */}
      {motionSupported && status === 'ready' && (
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3rem', marginBottom: '2rem',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          🕺
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50%       { transform: scale(1.1); }
            }
          `}</style>
        </div>
      )}

      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
        {motionSupported
          ? 'Move your phone to the beat! Or tap a button below.'
          : 'Motion not supported on this device — use the buttons below.'}
      </p>

      {/* Manual fallback buttons */}
      {status === 'ready' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: 320 }}>
          {[
            { move: 'step_left',  label: '⬅️ Step Left'  },
            { move: 'step_right', label: '➡️ Step Right' },
            { move: 'clap',       label: '👏 Clap'        },
            { move: 'bounce',     label: '⬆️ Bounce'      },
            { move: 'arm_cross',  label: '🤝 Arm Cross'   },
            { move: 'spin',       label: '🌀 Spin'        },
          ].map(({ move, label }) => (
            <button
              key={move}
              onPointerDown={() => handleManualInput(move)}
              style={{
                padding: '1.2rem 0.5rem',
                borderRadius: 'var(--radius)',
                border: lastMove === move ? '2px solid var(--color-accent)' : '2px solid #333',
                background: lastMove === move ? 'rgba(233,69,96,0.15)' : 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                fontWeight: 600,
                touchAction: 'manipulation',
                transition: 'all 0.1s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#555' }}>
        Session: {sessionId?.slice(0, 8)}…
      </p>
    </div>
  );
}
