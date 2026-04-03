import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovePrompt from '../components/MovePrompt';
import ScoreHUD from '../components/ScoreHUD';
import ErrorBanner from '../components/ErrorBanner';
import useGameTimer from '../hooks/useGameTimer';
import useSocket from '../hooks/useSocket';

export default function PlayerScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);

  const [session, setSession] = useState(null);
  const [choreography, setChoreography] = useState(null);
  const [activePrompts, setActivePrompts] = useState([]);
  const [score, setScore] = useState({ total: 0, combo: 0, streak: 0 });
  const [error, setError] = useState(null);

  const { currentTime, isPlaying, pause, resume } = useGameTimer(playerRef);
  const socket = useSocket(sessionId);

  // Load session + choreography on mount
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

  // Prompt scheduler: activate moves slightly before their target time
  useEffect(() => {
    if (!choreography) return;
    const LEAD_IN_SEC = 0.5;
    const active = choreography.moves.filter(
      (m) => currentTime >= m.time - LEAD_IN_SEC && currentTime < m.time + 1.5
    );
    setActivePrompts(active);
  }, [currentTime, choreography]);

  // Handle scored input from socket
  useEffect(() => {
    if (!socket) return;
    socket.on('input:scored', ({ result, scoreUpdate }) => {
      setScore(scoreUpdate);
    });
    return () => socket.off('input:scored');
  }, [socket]);

  function handleFinish() {
    navigate(`/results/${sessionId}`);
  }

  if (error) return <ErrorBanner message={error} />;
  if (!session) return <p style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>Loading session...</p>;

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Video Player */}
      <div style={{ width: '100%', aspectRatio: '16/9', background: '#000' }}>
        <div id="youtube-player" ref={playerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* HUD overlay */}
      <ScoreHUD score={score} currentTime={currentTime} />

      {/* Move prompts */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {activePrompts.map((prompt, i) => (
          <MovePrompt key={`${prompt.time}-${i}`} move={prompt.move} targetTime={prompt.time} currentTime={currentTime} />
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
        <button onClick={isPlaying ? pause : resume}
          style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)', border: 'none', background: 'var(--color-accent-2)', color: '#fff' }}>
          {isPlaying ? 'Pause' : 'Resume'}
        </button>
        <button onClick={handleFinish}
          style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)', border: 'none', background: 'var(--color-accent)', color: '#fff' }}>
          Finish
        </button>
      </div>
    </div>
  );
}
