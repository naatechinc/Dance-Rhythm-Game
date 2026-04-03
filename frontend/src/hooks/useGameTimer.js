import { useState, useEffect, useRef } from 'react';

/**
 * useGameTimer
 * Drives the master game clock from a YouTube IFrame player reference.
 * Falls back to a JS interval if the player is not yet available.
 */
export default function useGameTimer(playerRef) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  function startPolling() {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      const player = playerRef?.current;
      if (player && typeof player.getCurrentTime === 'function') {
        setCurrentTime(player.getCurrentTime());
        setIsPlaying(player.getPlayerState() === 1); // YT.PlayerState.PLAYING === 1
      }
    }, 100); // poll every 100ms for smooth prompt scheduling
  }

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    startPolling();
    return stopPolling;
  }, []);

  function pause() {
    const player = playerRef?.current;
    if (player && typeof player.pauseVideo === 'function') player.pauseVideo();
    setIsPlaying(false);
  }

  function resume() {
    const player = playerRef?.current;
    if (player && typeof player.playVideo === 'function') player.playVideo();
    setIsPlaying(true);
  }

  function seek(timeSec) {
    const player = playerRef?.current;
    if (player && typeof player.seekTo === 'function') {
      player.seekTo(timeSec, true);
      setCurrentTime(timeSec);
    }
  }

  return { currentTime, isPlaying, pause, resume, seek };
}
