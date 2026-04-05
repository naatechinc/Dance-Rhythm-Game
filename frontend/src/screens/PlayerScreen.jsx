import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ComboFeedback from '../components/ComboFeedback';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import KaraokeBar from '../components/KaraokeBar';
import MoveTimeline from '../components/MoveTimeline';
import MoveFigureRow from '../components/MoveFigureRow';
import VerticalScoreMeter from '../components/VerticalScoreMeter';
import ControllerModal from '../components/ControllerModal';
import GameScene, { PLAYER_COLORS } from '../components/GameScene';

const MAX_SCORE = 12000;

export default function PlayerScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [choreography, setChoreography] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [score, setScore] = useState({ total: 0, combo: 0, streak: 0, multiplier: 1 });
  const [playerScores, setPlayerScores] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const [scene, setScene] = useState('backyard');

  // Players state — starts with P1 (the host), others join via socket
  const [players, setPlayers] = useState([
    { id: 'p1-host', color: PLAYER_COLORS[0], move: 'default', connected: true }
  ]);

  const ytPlayerRef = useRef(null);
  const timerRef = useRef(null);
  const choreoRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => { choreoRef.current = choreography; }, [choreography]);

  // Load session + choreography
  useEffect(() => {
    async function load() {
      try {
        const sessRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/session/${sessionId}`);
        if (!sessRes.ok) throw new Error('Session not found.');
        const sessData = await sessRes.json();
        setSession(sessData);

        // Pass title + artist so backend can fetch real BPM from Spotify
        const title = encodeURIComponent(sessData.track?.title || '');
        const artist = encodeURIComponent(sessData.track?.artist || '');
        const choreoRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/choreo/${sessData.trackId}?title=${title}&artist=${artist}`
        );
        if (!choreoRes.ok) throw new Error('Choreography unavailable.');
        setChoreography(await choreoRes.json());
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [sessionId]);

  // Socket — listen for controllers joining and their moves
  useEffect(() => {
    if (!sessionId) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('session:join', { sessionId, role: 'host' });
    });

    socket.on('scene:change', ({ scene: newScene }) => {
      setScene(newScene);
    });

    socket.on('session:playerJoined', ({ playerId, color }) => {
      setPlayers(prev => {
        if (prev.find(p => p.id === playerId)) return prev;
        const idx = prev.length;
        const assignedColor = color || PLAYER_COLORS[idx % PLAYER_COLORS.length];
        return [...prev, {
          id: playerId,
          color: assignedColor,
          move: 'default',
          connected: true,
        }];
      });
    });

    socket.on('session:playerLeft', ({ playerId }) => {
      setPlayers(prev => prev.map(p =>
        p.id === playerId ? { ...p, connected: false } : p
      ));
    });

    socket.on('input:scored', ({ result, scoreUpdate, playerId }) => {
      setScore(scoreUpdate);
      setLastResult(result);
      setTimeout(() => setLastResult(null), 700);
      // Update per-player score
      if (playerId) {
        setPlayerScores(prev => ({ ...prev, [playerId]: scoreUpdate.total }));
      }
    });

    // Real-time motion from controller — update dancer pose + raw sensor data
    socket.on('controller:motion', (payload) => {
      if (!payload.playerId) return;
      setPlayers(prev => prev.map(p => {
        if (p.id !== payload.playerId) return p;
        return {
          ...p,
          move: payload.moveType || p.move || 'default',
          motion: { ax: payload.ax||0, ay: payload.ay||0, az: payload.az||0, gamma: payload.gamma||0 },
        };
      }));
      // Reset move after animation window
      if (payload.moveType) {
        setTimeout(() => {
          setPlayers(prev => prev.map(p =>
            p.id === payload.playerId ? { ...p, move: 'default' } : p
          ));
        }, 900);
      }
    });

    return () => { socket.disconnect(); };
  }, [sessionId]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

  // Create YouTube player — paused until modal dismissed
  useEffect(() => {
    if (!session?.trackId) return;

    function createPlayer() {
      if (!window.YT || !window.YT.Player) { setTimeout(createPlayer, 200); return; }
      if (ytPlayerRef.current) return;

      ytPlayerRef.current = new window.YT.Player('yt-player', {
        videoId: session.trackId,
        playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3 },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (e) => setIsPlaying(e.data === window.YT.PlayerState.PLAYING),
          onError: (e) => setError(`Video error (code ${e.data}).`),
        },
      });
    }

    window.onYouTubeIframeAPIReady = createPlayer;
    createPlayer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session]);

  function handleModalDismiss() {
    setShowModal(false);
    ytPlayerRef.current?.playVideo();
    timerRef.current = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p || typeof p.getCurrentTime !== 'function') return;
      const t = p.getCurrentTime();
      setCurrentTime(t);
      setIsPlaying(p.getPlayerState() === 1);
      // Update P1 dancer move from choreography
      const choreo = choreoRef.current;
      if (choreo) {
        const active = choreo.moves.find(m => t >= m.time - 0.3 && t < m.time + 1.2);
        if (active) {
          setPlayers(prev => prev.map((p, i) =>
            i === 0 ? { ...p, move: active.move } : p
          ));
        }
      }
    }, 100);
  }

  function handlePauseResume() {
    const p = ytPlayerRef.current;
    if (!p) return;
    if (isPlaying) p.pauseVideo(); else p.playVideo();
  }

  function handleFinish() {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate(`/results/${sessionId}`);
  }

  if (error) return (
    <div style={{ padding: '2rem' }}>
      <ErrorBanner message={error} />
      <button onClick={() => navigate('/search')}
        style={{ marginTop: '1rem', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer' }}>
        Back to Search
      </button>
    </div>
  );

  if (!session) return <LoadingSpinner message="Loading session..." />;

  const choreoMoves = choreography?.moves || [];
  const startSec = choreography?.startSec || 30;
  const endSec = choreography?.endSec || 72;
  const totalDuration = session?.track?.durationSec || 180;
  const p1Color = PLAYER_COLORS[0];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* QR Controller Modal */}
      {showModal && <ControllerModal sessionId={sessionId} onDismiss={handleModalDismiss} />}

      {/* GAME SCENE — backyard with stage */}
      <div style={{ position: 'relative', width: '100%', flexShrink: 0 }}>
        <GameScene
          players={players.map(p => ({ ...p, score: playerScores[p.id] || 0 }))}
          scene={scene}
          bpm={choreography?.bpm || 120}
          energy={choreography?.spotifyEnergy || 0.7}
          danceability={choreography?.spotifyDanceability || 0.7}
          isPlaying={isPlaying}
          currentTime={currentTime}
        />

        {/* YouTube video — fullscreen if video scene, else in projector */}
        <div style={
          scene === 'video' ? {
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            opacity: 0.6, zIndex: 0,
          } : {
            position: 'absolute',
            top: '16%', left: '33.1%',
            width: '33.8%', height: '25.8%',
            overflow: 'hidden', opacity: 0.92, zIndex: 1,
          }
        }>
          <div id="yt-player" style={{ width: '100%', height: '100%' }} />
          {!playerReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050510' }}>
              <LoadingSpinner message="" />
            </div>
          )}
        </div>

        <ComboFeedback result={lastResult} />

        {/* TOP HUD */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '6px 12px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)',
          pointerEvents: 'none',
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{score.total.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase' }}>Score</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ffd600' }}>x{score.combo}</div>
            <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase' }}>Combo</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#fff' }}>{formatTime(currentTime)}</div>
            <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase' }}>Time</div>
          </div>
        </div>

        {/* P1 score — LEFT side */}
        {players[0] && (
          <div style={{ position: 'absolute', left: 4, top: '15%', pointerEvents: 'none' }}>
            <VerticalScoreMeter
              score={playerScores[players[0].id] || score.total}
              maxScore={MAX_SCORE}
              color={players[0].color || PLAYER_COLORS[0]}
              playerLabel="P1"
            />
          </div>
        )}
        {/* P2+ scores — RIGHT side stacked */}
        {players.slice(1).length > 0 && (
          <div style={{ position: 'absolute', right: 4, top: '15%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {players.slice(1).map((p, i) => (
              <VerticalScoreMeter
                key={p.id}
                score={playerScores[p.id] || 0}
                maxScore={MAX_SCORE}
                color={p.color || PLAYER_COLORS[i + 1]}
                playerLabel={`P${i + 2}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* MOVE FIGURE ROW — current move + next 2 */}
      <MoveFigureRow moves={choreoMoves} currentTime={currentTime} color={p1Color} />

      {/* KARAOKE BAR */}
      <KaraokeBar videoId={session.trackId} currentTime={currentTime} />

      {/* MOVE TIMELINE */}
      <MoveTimeline
        moves={choreoMoves}
        currentTime={currentTime}
        playerColor={p1Color}
        startSec={startSec}
        endSec={endSec}
        totalDuration={totalDuration}
      />

      {/* CONTROLS */}
      <div style={{
        display: 'flex', gap: '0.75rem', padding: '8px 16px',
        background: 'rgba(0,0,0,0.9)',
        borderTop: '1px solid #111',
      }}>
        <button onClick={handlePauseResume}
          style={{ padding: '0.45rem 1.1rem', borderRadius: '8px', border: 'none', background: '#0f3460', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={handleFinish}
          style={{ padding: '0.45rem 1.1rem', borderRadius: '8px', border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
          Finish ✓
        </button>
        <button onClick={() => navigate('/search')}
          style={{ padding: '0.45rem 1.1rem', borderRadius: '8px', border: '1px solid #222', background: 'transparent', color: '#555', cursor: 'pointer', fontSize: '0.85rem' }}>
          ← Back
        </button>
        {/* Connected players indicator */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {players.map((p, i) => (
            <div key={p.id} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: p.connected ? p.color : '#333',
              border: `1px solid ${p.connected ? p.color : '#555'}`,
            }} title={`P${i+1} ${p.connected ? 'connected' : 'disconnected'}`}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return `${m}:${s}`;
}
