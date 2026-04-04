import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComboFeedback from '../components/ComboFeedback';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import KaraokeBar from '../components/KaraokeBar';
import MoveFigureRow from '../components/MoveFigureRow';
import MoveTimeline from '../components/MoveTimeline';
import VerticalScoreMeter from '../components/VerticalScoreMeter';
import ControllerModal from '../components/ControllerModal';

const MAX_SCORE = 12000;
const PLAYER_COLOR = '#e94560';

export default function PlayerScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [choreography, setChoreography] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [showModal, setShowModal] = useState(true); // QR modal shown on load
  const [score, setScore] = useState({ total: 0, combo: 0, streak: 0, multiplier: 1 });
  const [lastResult, setLastResult] = useState(null);

  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const choreoRef = useRef(null);

  useEffect(() => { choreoRef.current = choreography; }, [choreography]);

  // Load session + choreography
  useEffect(() => {
    async function load() {
      try {
        const sessRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/session/${sessionId}`);
        if (!sessRes.ok) throw new Error('Session not found.');
        const sessData = await sessRes.json();
        setSession(sessData);

        const choreoRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/choreo/${sessData.trackId}`);
        if (!choreoRes.ok) throw new Error('Choreography unavailable.');
        const choreoData = await choreoRes.json();
        setChoreography(choreoData);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [sessionId]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

  // Create YouTube player — starts paused until modal dismissed
  useEffect(() => {
    if (!session?.trackId) return;

    function createPlayer() {
      if (!window.YT || !window.YT.Player) { setTimeout(createPlayer, 200); return; }
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('yt-player', {
        videoId: session.trackId,
        playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3 },
        events: {
          onReady: () => {
            setPlayerReady(true);
            // Don't autoplay — wait for modal dismiss
          },
          onStateChange: (e) => {
            setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
          },
          onError: (e) => {
            setError(`Video error (code ${e.data}). Try a different song.`);
          },
        },
      });
    }

    window.onYouTubeIframeAPIReady = createPlayer;
    createPlayer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session]);

  // Start polling when modal dismissed and player ready
  function handleModalDismiss() {
    setShowModal(false);
    const p = playerRef.current;
    if (p && typeof p.playVideo === 'function') {
      p.playVideo();
    }
    // Start time polling
    timerRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== 'function') return;
      setCurrentTime(p.getCurrentTime());
      setIsPlaying(p.getPlayerState() === 1);
    }, 100);
  }

  function handlePauseResume() {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) p.pauseVideo();
    else p.playVideo();
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

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── QR Controller Modal (pauses video) ── */}
      {showModal && (
        <ControllerModal sessionId={sessionId} onDismiss={handleModalDismiss} />
      )}

      {/* ── VIDEO at 50% opacity ── */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', flexShrink: 0 }}>
        <div id="yt-player" style={{ width: '100%', height: '100%', opacity: 0.5 }} />

        {!playerReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <LoadingSpinner message="Loading video..." />
          </div>
        )}

        <ComboFeedback result={lastResult} />

        {/* TOP HUD */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '8px 12px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
          pointerEvents: 'none',
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{score.total.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>Score</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#ffd600' }}>x{score.combo}</div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>Combo</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, color: '#fff' }}>{formatTime(currentTime)}</div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>Time</div>
          </div>
        </div>

        {/* LEFT: Vertical score meter */}
        <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <VerticalScoreMeter score={score.total} maxScore={MAX_SCORE} color={PLAYER_COLOR} playerLabel="P1" />
        </div>

        {/* CENTER BOTTOM: 3 stick figures overlaid on video */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          pointerEvents: 'none',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
        }}>
          <MoveFigureRow
            moves={choreoMoves}
            currentTime={currentTime}
            color={PLAYER_COLOR}
          />
        </div>
      </div>

      {/* ── KARAOKE BAR ── */}
      <KaraokeBar videoId={session.trackId} currentTime={currentTime} />

      {/* ── MOVE TIMELINE ── */}
      <MoveTimeline
        moves={choreoMoves}
        currentTime={currentTime}
        playerColor={PLAYER_COLOR}
        startSec={startSec}
        endSec={endSec}
        totalDuration={totalDuration}
      />

      {/* ── CONTROLS ── */}
      <div style={{
        display: 'flex', gap: '0.75rem', padding: '10px 16px',
        background: 'rgba(0,0,0,0.9)',
        borderTop: '1px solid #111',
      }}>
        <button onClick={handlePauseResume}
          style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none', background: '#0f3460', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={handleFinish}
          style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}>
          Finish ✓
        </button>
        <button onClick={() => navigate('/search')}
          style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: '1px solid #222', background: 'transparent', color: '#555', cursor: 'pointer', fontSize: '0.9rem' }}>
          ← Back
        </button>
      </div>
    </div>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return `${m}:${s}`;
}
