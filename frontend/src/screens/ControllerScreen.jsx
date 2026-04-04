import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

/**
 * ControllerScreen
 * Phone-side controller. Connects directly via fetch to verify session exists,
 * then uses Socket.io for motion data.
 */
export default function ControllerScreen() {
  const { sessionId } = useParams();
  const [status, setStatus] = useState('connecting');
  const [lastMove, setLastMove] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    // First verify session exists via REST
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    fetch(`${apiUrl}/api/session/${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Session not found');
        return res.json();
      })
      .then(() => {
        setStatus('ready');
        // Now try socket connection
        connectSocket();
      })
      .catch(() => {
        setStatus('error');
      });

    function connectSocket() {
      // Dynamically import socket.io-client
      import('socket.io-client').then(({ io }) => {
        const socket = io(import.meta.env.VITE_SOCKET_URL, {
          transports: ['polling', 'websocket'],
          withCredentials: true,
        });

        socket.on('connect', () => {
          socket.emit('session:join', { sessionId, role: 'controller' });
          setStatus('connected');
        });

        socket.on('connect_error', () => {
          // Still show ready even if socket fails — manual buttons still work
          setStatus('ready');
        });

        socket.on('input:scored', ({ result }) => {
          setLastMove(result);
          setTimeout(() => setLastMove(null), 600);
        });

        socketRef.current = socket;
      });
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [sessionId]);

  function handleTap(moveType) {
    setLastMove(moveType);
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('input:submit', {
        sessionId,
        inputTimeSec: performance.now() / 1000,
        moveType,
      });
    }
    setTimeout(() => setLastMove(null), 300);
  }

  const feedbackColors = {
    perfect: '#ffd600', good: '#00e676', okay: '#40c4ff', miss: '#ff5252',
  };

  const statusText = {
    connecting: '⏳ Checking session...',
    ready: '✅ Ready! Tap moves below.',
    connected: '🎮 Controller connected!',
    error: '❌ Session not found. Check your code.',
  };

  const MOVES = [
    { move: 'step_left', label: '⬅️ Step Left' },
    { move: 'step_right', label: '➡️ Step Right' },
    { move: 'clap', label: '👏 Clap' },
    { move: 'bounce', label: '⬆️ Bounce' },
    { move: 'arm_cross', label: '🤝 Arm Cross' },
    { move: 'spin', label: '🌀 Spin' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0d1a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', userSelect: 'none',
    }}>

      <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
        🕺 Dance Controller
      </h2>

      <div style={{
        marginBottom: '1.5rem', fontSize: '0.9rem',
        color: status === 'connected' ? '#00e676' : status === 'error' ? '#ff5252' : '#888',
      }}>
        {statusText[status]}
      </div>

      {/* Hit feedback */}
      {lastMove && (
        <div style={{
          position: 'fixed', top: '20%', left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '2rem', fontWeight: 900,
          color: feedbackColors[lastMove] || '#fff',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          {lastMove}
        </div>
      )}

      {/* Move buttons */}
      {(status === 'ready' || status === 'connected') && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '1rem', width: '100%', maxWidth: 320,
        }}>
          {MOVES.map(({ move, label }) => (
            <button
              key={move}
              onPointerDown={() => handleTap(move)}
              style={{
                padding: '1.2rem 0.5rem',
                borderRadius: '8px',
                border: '2px solid #333',
                background: '#1a1a2e',
                color: '#eee', fontSize: '0.95rem',
                fontWeight: 600, cursor: 'pointer',
                touchAction: 'manipulation',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <p style={{ marginTop: '2rem', fontSize: '0.7rem', color: '#333' }}>
        Session: {sessionId?.slice(0, 8)}…
      </p>
    </div>
  );
}
