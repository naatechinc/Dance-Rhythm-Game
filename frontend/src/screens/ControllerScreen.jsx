import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

/**
 * ControllerScreen — phone-side motion controller
 * Uses DeviceMotion API to detect gestures and send them via socket.
 * No buttons — pure motion detection.
 */
export default function ControllerScreen() {
  const { sessionId } = useParams();
  const [status, setStatus] = useState('connecting');
  const [lastMove, setLastMove] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [motionGranted, setMotionGranted] = useState(false);
  const socketRef = useRef(null);
  const motionRef = useRef({ ax: 0, ay: 0, az: 0, alpha: 0, beta: 0, gamma: 0 });
  const lastMoveTime = useRef(0);
  const COOLDOWN_MS = 600;

  useEffect(() => {
    if (!sessionId) return;
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    fetch(`${apiUrl}/api/session/${sessionId}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(() => { setStatus('ready'); connectSocket(); })
      .catch(() => setStatus('error'));

    function connectSocket() {
      import('socket.io-client').then(({ io }) => {
        const socket = io(import.meta.env.VITE_SOCKET_URL, {
          transports: ['polling', 'websocket'],
          withCredentials: true,
        });
        socket.on('connect', () => {
          socket.emit('session:join', { sessionId, role: 'controller' });
          setStatus('connected');
        });
        socket.on('connect_error', () => setStatus('ready'));
        socket.on('input:scored', ({ result }) => {
          setFeedback(result);
          setTimeout(() => setFeedback(null), 700);
        });
        socketRef.current = socket;
      });
    }

    return () => socketRef.current?.disconnect();
  }, [sessionId]);

  // Request motion permission (iOS 13+) and start detection
  function requestMotion() {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(state => { if (state === 'granted') startMotion(); })
        .catch(() => {});
    } else {
      startMotion();
    }
  }

  function startMotion() {
    setMotionGranted(true);

    window.addEventListener('devicemotion', (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      motionRef.current = {
        ax: acc.x || 0,
        ay: acc.y || 0,
        az: acc.z || 0,
      };

      const now = Date.now();
      if (now - lastMoveTime.current < COOLDOWN_MS) return;

      const { ax, ay, az } = motionRef.current;
      const absX = Math.abs(ax);
      const absY = Math.abs(ay);
      const absZ = Math.abs(az);
      const total = absX + absY + absZ;

      // Gesture classification
      let detected = null;
      if (total > 20) {
        if (absZ > absX && absZ > absY) {
          detected = az > 0 ? 'bounce' : 'clap';
        } else if (absX > absY) {
          detected = ax > 0 ? 'step_right' : 'step_left';
        } else {
          detected = ay > 0 ? 'arm_swing' : 'point';
        }
      }

      if (detected) {
        lastMoveTime.current = now;
        setLastMove(detected);
        setTimeout(() => setLastMove(null), 400);
        const socket = socketRef.current;
        if (socket?.connected) {
          socket.emit('controller:motion', {
            sessionId,
            playerId: socket.id,
            moveType: detected,
            timestamp: now,
          });
          socket.emit('input:submit', {
            sessionId,
            inputTimeSec: performance.now() / 1000,
            moveType: detected,
          });
        }
      }
    });

    // Also detect shake/spin via orientation
    window.addEventListener('deviceorientation', (e) => {
      if (Math.abs(e.gamma) > 60) {
        const now = Date.now();
        if (now - lastMoveTime.current < COOLDOWN_MS) return;
        lastMoveTime.current = now;
        setLastMove('spin');
        setTimeout(() => setLastMove(null), 400);
        socketRef.current?.emit('controller:motion', {
          sessionId,
          playerId: socketRef.current.id,
          moveType: 'spin',
          timestamp: now,
        });
      }
    });
  }

  const feedbackColors = {
    perfect: '#ffd600', good: '#00e676', okay: '#40c4ff',
    miss: '#ff5252', step_left: '#e94560', step_right: '#e94560',
    clap: '#00e676', bounce: '#40c4ff', spin: '#b04dff',
    arm_swing: '#ff9800', point: '#ffd600',
  };

  const MOVE_ICONS = {
    step_left: '⬅️', step_right: '➡️', clap: '👏',
    bounce: '⬆️', arm_swing: '💪', spin: '🌀', point: '👆',
    perfect: '⭐', good: '✅', okay: '🆗', miss: '❌',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0d1a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem', userSelect: 'none', textAlign: 'center',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕺</div>
      <h2 style={{ color: '#fff', fontSize: '1.3rem', margin: '0 0 0.5rem' }}>
        Dance Controller
      </h2>

      <div style={{
        fontSize: '0.9rem', marginBottom: '2rem',
        color: status === 'connected' ? '#00e676' : status === 'error' ? '#ff5252' : '#888',
      }}>
        {status === 'connecting' && '⏳ Connecting...'}
        {status === 'ready' && '✅ Connected — tap below to enable motion'}
        {status === 'connected' && (motionGranted ? '🎮 Move your phone to dance!' : '✅ Connected — tap below to enable motion')}
        {status === 'error' && '❌ Session not found'}
      </div>

      {/* Move feedback flash */}
      {(lastMove || feedback) && (
        <div style={{
          fontSize: '4rem', marginBottom: '1rem',
          filter: 'drop-shadow(0 0 12px currentColor)',
        }}>
          {MOVE_ICONS[lastMove || feedback] || '🕺'}
        </div>
      )}
      {feedback && (
        <div style={{
          fontSize: '1.5rem', fontWeight: 900,
          color: feedbackColors[feedback] || '#fff',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: '1rem',
        }}>
          {feedback}!
        </div>
      )}

      {/* Enable motion button */}
      {(status === 'ready' || status === 'connected') && !motionGranted && (
        <button
          onClick={requestMotion}
          style={{
            padding: '1rem 2rem', borderRadius: '12px',
            border: 'none', background: '#e94560',
            color: '#fff', fontSize: '1.1rem',
            fontWeight: 700, cursor: 'pointer',
            marginBottom: '1rem',
          }}
        >
          Enable Motion Control
        </button>
      )}

      {motionGranted && (
        <div style={{ color: '#444', fontSize: '0.85rem', maxWidth: 260 }}>
          <p style={{ marginBottom: '0.5rem' }}>Tilt phone left/right → step</p>
          <p style={{ marginBottom: '0.5rem' }}>Push forward/back → bounce/clap</p>
          <p style={{ marginBottom: '0.5rem' }}>Tilt sideways → spin</p>
          <p style={{ marginBottom: '0.5rem' }}>Swing up → point</p>
        </div>
      )}

      <p style={{ marginTop: '2rem', fontSize: '0.7rem', color: '#222' }}>
        {sessionId?.slice(0, 8)}…
      </p>
    </div>
  );
}
