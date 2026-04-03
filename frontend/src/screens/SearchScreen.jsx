import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrackCard from '../components/TrackCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error('Search failed. Please try again.');
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(track) {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.videoId, track }),
      });
      if (!res.ok) throw new Error('Could not start session.');
      const { sessionId } = await res.json();
      navigate(`/play/${sessionId}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🕺 Dance Rhythm Game</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        Search for a song to start dancing
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search song or artist..."
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius)',
            border: '1px solid #333',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '1rem',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            border: 'none',
            background: 'var(--color-accent)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          Search
        </button>
      </form>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {loading && <LoadingSpinner />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {results.map((track) => (
          <TrackCard key={track.videoId} track={track} onSelect={handleSelect} />
        ))}
        {!loading && results.length === 0 && query && (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '2rem' }}>
            No results found. Try a different search.
          </p>
        )}
      </div>
    </div>
  );
}
