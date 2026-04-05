import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

/**
 * ControllerScreen
 * Real-time motion controller.
 * - Reads accelerometer + gyroscope at full rate
 * - Classifies gestures in real time
 * - Shows LIVE body outline that mirrors the phone movement
 * - Streams motion to game via socket
 */

const PLAYER_COLORS = ['#e94560', '#40c4ff', '#00e676', '#b04dff', '#ff9800', '#ff4ea3'];

const MOVE_LABELS = {
  step_left: '⬅ Step Left',
  step_right: '➡ Step Right',
  clap: '👏 Clap',
  bounce: '⬆ Bounce',
  arm_swing: '💪 Arm Swing',
  arm_cross: '🤝 Arm Cross',
  spin: '🌀 Spin',
  point: '☝ Point',
  pivot: '↩ Pivot',
  footwork: '👟 Footwork',
};

export default function ControllerScreen() {
  const { sessionId } = useParams();
  const [status, setStatus] = useState('connecting');
  const [permissionNeeded, setPermissionNeeded] = useState(false);
  const [motionActive, setMotionActive] = useState(false);
  const [playerColor, setPlayerColor] = useState('#e94560');
  const [currentMove, setCurrentMove] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Live sensor readings for visualization
  const [motion, setMotion] = useState({ ax: 0, ay: 0, az: 0, alpha: 0, beta: 0, gamma: 0 });

  const socketRef = useRef(null);
  const lastMoveTime = useRef(0);
  const COOLDOWN_MS = 500;
  const colorRef = useRef('#e94560');

  // Connect + verify session
  useEffect(() => {
    if (!sessionId) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/session/${sessionId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
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
        // Get assigned player color from host
        socket.on('player:color', ({ color }) => {
          setPlayerColor(color);
          colorRef.current = color;
        });
        socket.on('input:scored', ({ result }) => {
          setFeedback(result);
          setTimeout(() => setFeedback(null), 800);
        });
        socketRef.current = socket;
      });
    }

    // Check if we need permission request
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      setPermissionNeeded(true);
    } else {
      startMotion();
    }

    return () => socketRef.current?.disconnect();
  }, [sessionId]);

  function requestPermission() {
    DeviceMotionEvent.requestPermission()
      .then(state => { if (state === 'granted') startMotion(); })
      .catch(() => {});
  }

  function startMotion() {
    setMotionActive(true);

    // Smoothing buffers
    const buf = { ax: [], ay: [], az: [], alpha: [], beta: [], gamma: [] };
    const SMOOTH = 5;

    function smooth(key, val) {
      buf[key].push(val);
      if (buf[key].length > SMOOTH) buf[key].shift();
      return buf[key].reduce((s, v) => s + v, 0) / buf[key].length;
    }

    window.addEventListener('devicemotion', (e) => {
      const acc = e.accelerationIncludingGravity || {};
      const rot = e.rotationRate || {};

      const ax = smooth('ax', acc.x || 0);
      const ay = smooth('ay', acc.y || 0);
      const az = smooth('az', acc.z || 0);
      const alpha = smooth('alpha', rot.alpha || 0);
      const beta  = smooth('beta',  rot.beta  || 0);
      const gamma = smooth('gamma', rot.gamma || 0);

      // Update live visualization
      setMotion({ ax, ay, az, alpha, beta, gamma });

      // Stream raw motion to server
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('controller:motion', {
          sessionId, playerId: socket.id,
          ax, ay, az, alpha, beta, gamma,
          timestamp: Date.now(),
        });
      }

      // Gesture classification
      const now = Date.now();
      if (now - lastMoveTime.current < COOLDOWN_MS) return;

      const absX = Math.abs(ax);
      const absY = Math.abs(ay);
      const absZ = Math.abs(az);
      const absAlpha = Math.abs(alpha);
      const absGamma = Math.abs(gamma);
      const total = absX + absY + absZ;

      let detected = null;

      if (absAlpha > 180 || absGamma > 80) {
        detected = 'spin';
      } else if (total > 18) {
        if (absX > absY && absX > absZ) {
          detected = ax > 0 ? 'step_right' : 'step_left';
        } else if (absZ > absX && absZ > absY) {
          detected = az > 0 ? 'bounce' : 'clap';
        } else if (absY > absX && absY > absZ) {
          detected = ay > 0 ? 'arm_swing' : 'point';
        }
      } else if (total > 12) {
        if (absX > absY) {
          detected = ax > 0 ? 'arm_cross' : 'pivot';
        } else {
          detected = 'footwork';
        }
      }

      if (detected) {
        lastMoveTime.current = now;
        setCurrentMove(detected);
        setTimeout(() => setCurrentMove(null), COOLDOWN_MS - 50);
        if (socket?.connected) {
          socket.emit('input:submit', {
            sessionId,
            inputTimeSec: performance.now() / 1000,
            moveType: detected,
          });
        }
      }
    }, { passive: true });
  }

  // Clamp helper for visualization
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  // Map accelerometer to body part positions
  const bodyX = clamp(motion.ax * 4, -40, 40);
  const bodyY = clamp(-motion.ay * 3, -30, 30);
  const tilt = clamp(motion.gamma * 0.5, -35, 35);

  const feedbackColors = {
    perfect: '#ffd600', good: '#00e676', okay: '#40c4ff', miss: '#ff5252',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#08080f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '1rem',
      fontFamily: 'sans-serif',
    }}>

      {/* Status */}
      <div style={{
        width: '100%', textAlign: 'center', padding: '0.5rem 0',
        fontSize: '0.85rem',
        color: status === 'connected' ? '#00e676' : status === 'error' ? '#ff5252' : '#666',
      }}>
        {status === 'connecting' && '⏳ Connecting...'}
        {status === 'ready' && '✅ Ready'}
        {status === 'connected' && '🎮 Controller live'}
        {status === 'error' && '❌ Session not found'}
      </div>

      {/* Feedback flash */}
      {feedback && (
        <div style={{
          fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.1em',
          color: feedbackColors[feedback] || '#fff',
          textTransform: 'uppercase', marginBottom: '0.5rem',
        }}>
          {feedback}!
        </div>
      )}

      {/* Current move label */}
      <div style={{
        height: 28, display: 'flex', alignItems: 'center',
        fontSize: '1rem', fontWeight: 700,
        color: currentMove ? playerColor : '#333',
        transition: 'color 0.15s',
        marginBottom: '0.5rem',
      }}>
        {currentMove ? MOVE_LABELS[currentMove] || currentMove : '— waiting —'}
      </div>

      {/* LIVE BODY VISUALIZATION */}
      <svg width="200" height="300" viewBox="0 0 200 300" style={{ marginBottom: '1rem' }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Background grid */}
        {[-60,-40,-20,0,20,40,60].map(x => (
          <line key={x} x1={100+x} y1="10" x2={100+x} y2="290" stroke="#111" strokeWidth="0.5"/>
        ))}
        {[40,80,120,160,200,240,280].map(y => (
          <line key={y} x1="20" y1={y} x2="180" y2={y} stroke="#111" strokeWidth="0.5"/>
        ))}

        {/* Motion trails — show where body is going */}
        <ellipse cx="100" cy={150 + bodyY} rx={20 + Math.abs(bodyX) * 0.3} ry="8"
          fill={playerColor} opacity="0.08"/>

        {/* BODY — moves based on accelerometer */}
        <g transform={`translate(${100 + bodyX * 0.5}, ${150 + bodyY * 0.3}) rotate(${tilt})`}
           style={{ transition: 'transform 0.08s ease-out' }}
           filter="url(#glow)">

          {/* Torso */}
          <path d={`M-18,22 Q0,42 18,22 Q22,0 0,-8 Q-22,0 -18,22Z`}
            fill={playerColor} opacity="0.9"/>

          {/* Head */}
          <circle cx="0" cy="-22" r="18" fill={playerColor} opacity="0.9"/>

          {/* Left arm — moves with gamma (phone tilt) */}
          <line x1="-18" y1="8"
            x2={-18 + clamp(-motion.gamma * 0.8, -35, 15)}
            y2={8 + clamp(Math.abs(motion.gamma) * 0.4, 0, 30)}
            stroke={playerColor} strokeWidth="9" strokeLinecap="round" opacity="0.85"/>

          {/* Right arm — moves with alpha (rotation) */}
          <line x1="18" y1="8"
            x2={18 + clamp(motion.gamma * 0.8, -15, 35)}
            y2={8 + clamp(Math.abs(motion.gamma) * 0.4, 0, 30)}
            stroke={playerColor} strokeWidth="10" strokeLinecap="round" opacity="0.9"/>

          {/* Left leg */}
          <line x1="-8" y1="42"
            x2={-8 + clamp(-motion.ax * 2, -20, 10)}
            y2={42 + clamp(30 - Math.abs(motion.ay), 10, 40)}
            stroke={playerColor} strokeWidth="9" strokeLinecap="round" opacity="0.85"/>

          {/* Right leg */}
          <line x1="8" y1="42"
            x2={8 + clamp(motion.ax * 2, -10, 20)}
            y2={42 + clamp(30 - Math.abs(motion.ay), 10, 40)}
            stroke={playerColor} strokeWidth="9" strokeLinecap="round" opacity="0.85"/>
        </g>

        {/* Sensor bars at bottom */}
        <text x="100" y="290" textAnchor="middle" fontSize="9" fill="#333">
          {`ax:${motion.ax.toFixed(1)} ay:${motion.ay.toFixed(1)} az:${motion.az.toFixed(1)}`}
        </text>
      </svg>

      {/* Sensor meters */}
      <div style={{ width: '100%', maxWidth: 260, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { label: 'X (left/right)', val: motion.ax, range: 20, color: '#e94560' },
          { label: 'Y (up/down)',    val: motion.ay, range: 20, color: '#40c4ff' },
          { label: 'Z (fwd/back)',   val: motion.az, range: 20, color: '#00e676' },
          { label: 'Spin (γ)',       val: motion.gamma, range: 90, color: '#b04dff' },
        ].map(({ label, val, range, color }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#444', marginBottom: 2 }}>
              <span>{label}</span><span>{val.toFixed(1)}</span>
            </div>
            <div style={{ height: 6, background: '#111', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '50%', top: 0,
                width: `${Math.abs(val) / range * 50}%`,
                height: '100%', background: color,
                transform: val < 0 ? 'translateX(-100%)' : 'none',
                borderRadius: 3, transition: 'width 0.05s linear',
              }}/>
              <div style={{ position: 'absolute', left: '50%', top: 0, width: 1, height: '100%', background: '#333' }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Enable motion button for iOS */}
      {permissionNeeded && !motionActive && (
        <button onClick={requestPermission} style={{
          marginTop: '1.5rem', padding: '0.9rem 2rem',
          borderRadius: 10, border: 'none',
          background: playerColor, color: '#fff',
          fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
        }}>
          Enable Motion Control
        </button>
      )}

      <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: '#222' }}>
        {sessionId?.slice(0, 8)}…
      </p>
    </div>
  );
}
