import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ComboFeedback from '../components/ComboFeedback';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import KaraokeBar from '../components/KaraokeBar';
import MoveFigureRow from '../components/MoveFigureRow';
import MoveTimeline from '../components/MoveTimeline';
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

  // Socket
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

    socket.on('scene:change', ({ scene: newScene }) => setScene(newScene));

    socket.on('session:playerJoined', ({ playerId, color }) => {
      setPlayers(prev => {
        if (prev.find(p => p.id === playerId)) return prev;
        const idx = prev.length;
        return [...prev, {
          id: playerId,
          color: color || PLAYER_COLORS[idx % PLAYER_COLORS.length],
          move: 'default', connected: true,
        }];
      });
    });

    socket.on('session:playerLeft', ({ playerId }) => {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, connected: false } : p));
    });

    socket.on('input:scored', ({ result, scoreUpdate, playerId }) => {
      setScore(scoreUpdate);
      setLastResult(result);
      setTimeout(() => setLastResult(null), 700);
      if (playerId) setPlayerScores(prev => ({ ...prev, [playerId]: scoreUpdate.total }));
    });

    socket.on('controller:motion', (payload) => {
      if (!payload.playerId) return;
      setPlayers(prev => prev.map(p =>
        p.id !== payload.playerId ? p : {
          ...p,
          move: payload.moveType || p.move || 'default',
          motion: { ax: payload.ax||0, ay: payload.ay||0, az: payload.az||0, gamma: payload.gamma||0 },
        }
      ));
      if (payload.moveType) {
        setTimeout(() => {
          setPlayers(prev => prev.map(p =>
            p.id === payload.playerId ? { ...p, move: 'default' } : p
          ));
        }, 900);
      }
    });

    return () => socket.disconnect();
  }, [sessionId]);

  // YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

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
      setCurrentTime(p.getCurrentTime());
      setIsPlaying(p.getPlayerState() === 1);
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
  const p1Color = players[0]?.color || PLAYER_COLORS[0];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {showModal && <ControllerModal sessionId={sessionId} onDismiss={handleModalDismiss} />}

      {/* ── MAIN GAME AREA ── fills remaining space above bottom bar */}
      <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0 }}>

        {/* GameScene SVG — base layer */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <GameScene
            players={players.map(p => ({ ...p, score: playerScores[p.id] || 0 }))}
            scene={scene}
            bpm={choreography?.bpm || 120}
            energy={choreography?.spotifyEnergy || 0.7}
            danceability={choreography?.spotifyDanceability || 0.7}
            isPlaying={isPlaying}
            currentTime={currentTime}
          />
        </div>

        {/* YouTube video — sits BELOW dancers (zIndex 1) in projector position */}
        <div style={
          scene === 'video' ? {
            position: 'absolute', inset: 0, zIndex: 1, opacity: 0.65,
          } : {
            position: 'absolute',
            top: '16.2%', left: '33.1%',
            width: '33.75%', height: '25.8%',
            overflow: 'hidden', zIndex: 1, opacity: 0.95,
          }
        }>
          <div id="yt-player" style={{ width: '100%', height: '100%' }} />
          {!playerReady && (
            <div style={{ position: 'absolute', inset: 0, background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LoadingSpinner message="" />
            </div>
          )}
        </div>

        {/* Combo feedback — above video */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
          <ComboFeedback result={lastResult} />
        </div>

        {/* TOP HUD — above everything */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '6px 12px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
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

        {/* P1 score meter — LEFT, above everything */}
        {players[0] && (
          <div style={{ position: 'absolute', left: 4, top: '15%', zIndex: 5, pointerEvents: 'none' }}>
            <VerticalScoreMeter
              score={playerScores[players[0].id] || score.total}
              maxScore={MAX_SCORE}
              color={players[0].color || PLAYER_COLORS[0]}
              playerLabel="P1"
            />
          </div>
        )}

        {/* P2+ score meters — RIGHT, above everything */}
        {players.slice(1).length > 0 && (
          <div style={{ position: 'absolute', right: 4, top: '15%', zIndex: 5, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
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

        {/* Move figure row — overlaid at bottom of game area */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5, pointerEvents: 'none' }}>
          <MoveFigureRow moves={choreoMoves} currentTime={currentTime} color={p1Color} />
        </div>
      </div>

      {/* ── BOTTOM STRIP ── karaoke + timeline + controls */}
      <KaraokeBar videoId={session.trackId} currentTime={currentTime} />

      <MoveTimeline
        moves={choreoMoves}
        currentTime={currentTime}
        playerColor={p1Color}
        startSec={startSec}
        endSec={endSec}
        totalDuration={totalDuration}
      />

      <div style={{
        display: 'flex', gap: '0.75rem', padding: '6px 12px',
        background: 'rgba(0,0,0,0.95)', borderTop: '1px solid #111', flexShrink: 0,
      }}>
        <button onClick={handlePauseResume}
          style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', background: '#0f3460', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={handleFinish}
          style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
          Finish ✓
        </button>
        <button onClick={() => navigate('/search')}
          style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid #222', background: 'transparent', color: '#555', cursor: 'pointer', fontSize: '0.85rem' }}>
          ← Back
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          {players.map((p, i) => (
            <div key={p.id} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: p.connected ? p.color : '#333',
              border: `1px solid ${p.connected ? p.color : '#555'}`,
            }} title={`P${i+1}`} />
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
