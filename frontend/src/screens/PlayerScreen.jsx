import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ComboFeedback from '../components/ComboFeedback';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import KaraokeBar from '../components/KaraokeBar';
import StickFigure from '../components/StickFigure';
import MoveTimeline from '../components/MoveTimeline';
import VerticalScoreMeter from '../components/VerticalScoreMeter';

const MAX_SCORE = 12000;
const PLAYER_COLORS = ['#e94560', '#40c4ff', '#00e676', '#ffd600'];

export default function PlayerScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [choreography, setChoreography] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [score, setScore] = useState({ total: 0, combo: 0, streak: 0, multiplier: 1 });
  const [lastResult, setLastResult] = useState(null);
  const [currentMove, setCurrentMove] = useState(null);

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

  // Create YouTube player
  useEffect(() => {
    if (!session?.trackId) return;

    function createPlayer() {
      if (!window.YT || !window.YT.Player) { setTimeout(createPlayer, 200); return; }
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('yt-player', {
        videoId: session.trackId,
        playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3 },
        events: {
          onReady: (e) => {
            setPlayerReady(true);
            e.target.playVideo();
            timerRef.current = setInterval(() => {
              const p = playerRef.current;
              if (!p || typeof p.getCurrentTime !== 'function') return;
              const t = p.getCurrentTime();
              setCurrentTime(t);
              setIsPlaying(p.getPlayerState() === 1);
              // Find current move
              const choreo = choreoRef.current;
              if (choreo) {
                const active = choreo.moves.find(m => t >= m.time - 0.3 && t < m.time + 1.2);
                setCurrentMove(active || null);
              }
            }, 100);
          },
          onStateChange: (e) => setIsPlaying(e.data === window.YT.PlayerState.PLAYING),
          onError: (e) => setError(`Video error (code ${e.data}). Try a different song.`),
        },
      });
    }

    window.onYouTubeIframeAPIReady = createPlayer;
    createPlayer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session]);

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

  const p1Color = PLAYER_COLORS[0];
  const choreoMoves = choreography?.moves || [];
  const startSec = choreography?.startSec || 30;
  const endSec = choreography?.endSec || 72;
  const totalDuration = session?.track?.durationSec || 180;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* ── VIDEO at 50% opacity ── */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', flexShrink: 0 }}>
        <div id="yt-player" style={{ width: '100%', height: '100%', opacity: 0.5 }} />

        {!playerReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <LoadingSpinner message="Loading video..." />
          </div>
        )}

        {/* ── PERFECT/GOOD/MISS flash ── */}
        <ComboFeedback result={lastResult} />

        {/* ── TOP HUD: score + combo ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '8px 12px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
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

        {/* ── LEFT: Vertical score meter ── */}
        <div style={{
          position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}>
          <VerticalScoreMeter score={score.total} maxScore={MAX_SCORE} color={p1Color} playerLabel="P1" />
        </div>

        {/* ── CENTER: Big stick figure dancer ── */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <StickFigure
            move={currentMove?.move || 'default'}
            color={p1Color}
            size={120}
          />
        </div>
      </div>

      {/* ── KARAOKE BAR ── */}
      <KaraokeBar
        videoId={session.trackId}
        currentTime={currentTime}
      />

      {/* ── MOVE TIMELINE ── */}
      <MoveTimeline
        moves={choreoMoves}
        currentTime={currentTime}
        playerColor={p1Color}
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
