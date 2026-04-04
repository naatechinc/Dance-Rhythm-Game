import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovePrompt from '../components/MovePrompt';
import ScoreHUD from '../components/ScoreHUD';
import ComboFeedback from '../components/ComboFeedback';
import EnergyMeter from '../components/EnergyMeter';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PlayerScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [choreography, setChoreography] = useState(null);
  const [activePrompts, setActivePrompts] = useState([]);
  const [score, setScore] = useState({ total: 0, combo: 0, streak: 0, multiplier: 1 });
  const [lastResult, setLastResult] = useState(null);
  const [energy, setEnergy] = useState(0);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);

  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const choreoRef = useRef(null);

  useEffect(() => { choreoRef.current = choreography; }, [choreography]);

  useEffect(() => {
    async function load() {
      try {
        const sessRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/session/${sessionId}`
        );
        if (!sessRes.ok) throw new Error('Session not found.');
        const sessData = await sessRes.json();
        setSession(sessData);

        const choreoRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/choreo/${sessData.trackId}`
        );
        if (!choreoRes.ok) throw new Error('Choreography unavailable.');
        const choreoData = await choreoRes.json();
        setChoreography(choreoData);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [sessionId]);

  useEffect(() => {
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

  useEffect(() => {
    if (!session?.trackId) return;

    function createPlayer() {
      if (!window.YT || !window.YT.Player) {
        setTimeout(createPlayer, 200);
        return;
      }
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('yt-player', {
        videoId: session.trackId,
        playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 },
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
              const choreo = choreoRef.current;
              if (choreo) {
                const active = choreo.moves.filter(
                  (m) => t >= m.time - 0.5 && t < m.time + 1.5
                );
                setActivePrompts(active);
              }
            }, 100);
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

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#0d0d1a' }}>
      <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative' }}>
        <div id="yt-player" style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' }}>
          <ScoreHUD score={score} currentTime={currentTime} />
        </div>
        {!playerReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <LoadingSpinner message="Loading video..." />
          </div>
        )}
      </div>

      <ComboFeedback result={lastResult} />

      <div style={{ padding: '0.75rem 0 0' }}>
        <EnergyMeter energy={energy} />
      </div>

      <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 80 }}>
        {activePrompts.length === 0 && isPlaying && (
          <p style={{ color: '#555', fontSize: '0.85rem', textAlign: 'center' }}>Get ready...</p>
        )}
        {activePrompts.map((prompt, i) => (
          <MovePrompt key={`${prompt.time}-${i}`} move={prompt.move} targetTime={prompt.time} currentTime={currentTime} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 1rem 1.5rem' }}>
        <button onClick={handlePauseResume}
          style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', background: '#0f3460', color: '#fff', cursor: 'pointer' }}>
          {isPlaying ? 'Pause' : 'Resume'}
        </button>
        <button onClick={handleFinish}
          style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer' }}>
          Finish
        </button>
        <button onClick={() => navigate('/search')}
          style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: '1px solid #333', background: 'transparent', color: '#888', cursor: 'pointer' }}>
          Back
        </button>
      </div>
    </div>
  );
} 
