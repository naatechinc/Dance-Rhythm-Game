import React, { useEffect, useState, useRef } from 'react';

/**
 * KaraokeBar
 * Just Dance style lyrics display.
 * Shows current lyric line with a sweeping highlight,
 * and the next line below in white.
 *
 * Props:
 *   videoId: string — YouTube video ID (used to fetch lyrics)
 *   currentTime: number — current playback time in seconds
 */

export default function KaraokeBar({ videoId, currentTime = 0 }) {
  const [lines, setLines] = useState([]); // [{ time, duration, text }]
  const [status, setStatus] = useState('loading'); // loading | ready | error | nolyrics
  const cacheRef = useRef({});

  // Fetch synced lyrics from LRCLIB
  useEffect(() => {
    if (!videoId) return;
    if (cacheRef.current[videoId]) {
      setLines(cacheRef.current[videoId]);
      setStatus('ready');
      return;
    }

    setStatus('loading');

    async function fetchLyrics() {
      try {
        // First get video title from our backend session data (passed via videoId)
        // We'll search LRCLIB by video ID hint — use a generic search
        const res = await fetch(
          `https://lrclib.net/api/search?q=${encodeURIComponent(videoId)}`
        );
        if (!res.ok) throw new Error('LRCLIB error');
        const data = await res.json();

        if (!data || data.length === 0) {
          setStatus('nolyrics');
          return;
        }

        // Pick first result with synced lyrics
        const match = data.find(d => d.syncedLyrics) || data[0];
        if (!match?.syncedLyrics) {
          setStatus('nolyrics');
          return;
        }

        const parsed = parseLRC(match.syncedLyrics);
        cacheRef.current[videoId] = parsed;
        setLines(parsed);
        setStatus('ready');
      } catch (e) {
        setStatus('error');
      }
    }

    fetchLyrics();
  }, [videoId]);

  // Find current and next line
  let currentLine = null;
  let nextLine = null;
  let progress = 0;

  if (lines.length > 0 && status === 'ready') {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= currentTime) {
        currentLine = lines[i];
        nextLine = lines[i + 1] || null;
        // Progress through current line
        const lineEnd = nextLine ? nextLine.time : lines[i].time + 3;
        progress = Math.min(1, (currentTime - lines[i].time) / (lineEnd - lines[i].time));
      }
    }
  }

  if (status === 'loading') {
    return (
      <div style={containerStyle}>
        <div style={{ color: '#444', fontSize: 12 }}>Loading lyrics...</div>
      </div>
    );
  }

  if (status === 'nolyrics' || status === 'error' || !currentLine) {
    return null; // hide bar if no lyrics
  }

  return (
    <div style={containerStyle}>
      {/* Current line with sweep highlight */}
      <div style={{ position: 'relative', overflow: 'hidden', lineHeight: 1.3 }}>
        {/* Base text */}
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {currentLine.text}
        </div>
        {/* Highlighted overlay — clips to progress % */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${progress * 100}%`,
          overflow: 'hidden',
          fontSize: 18,
          fontWeight: 700,
          color: '#ff3d6b',
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap',
          transition: 'width 0.1s linear',
        }}>
          {currentLine.text}
        </div>
      </div>

      {/* Next line */}
      {nextLine && (
        <div style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.55)',
          marginTop: 2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '0.02em',
        }}>
          {nextLine.text}
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  width: '100%',
  padding: '8px 20px 10px',
  background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.6))',
  textAlign: 'center',
  minHeight: 56,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

/**
 * Parse LRC format: [mm:ss.xx] lyric text
 */
function parseLRC(lrc) {
  const lines = [];
  const regex = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/g;
  let match;
  while ((match = regex.exec(lrc)) !== null) {
    const min = parseInt(match[1]);
    const sec = parseFloat(match[2]);
    const text = match[3].trim();
    if (text) {
      lines.push({ time: min * 60 + sec, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}
