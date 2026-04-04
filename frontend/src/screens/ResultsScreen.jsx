import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const RANK_THRESHOLDS = [
  { rank: 'S', min: 95 },
  { rank: 'A', min: 80 },
  { rank: 'B', min: 65 },
  { rank: 'C', min: 0 },
];

function getRank(accuracy) {
  return RANK_THRESHOLDS.find((t) => accuracy >= t.min)?.rank ?? 'C';
}

export default function ResultsScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/session/${sessionId}/results`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (_) {
        // Fall back to placeholder
        setResults({ total: 0, accuracy: 0, combo: 0, breakdown: {} });
      }
    }
    load();
  }, [sessionId]);

  const rank = results ? getRank(results.accuracy ?? 0) : '-';
  const rankColors = { S: '#ffd600', A: '#00e676', B: '#40c4ff', C: '#888' };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Results</h2>

      <div style={{
        fontSize: '6rem', fontWeight: 800,
        color: rankColors[rank] ?? '#888',
        marginBottom: '1rem',
      }}>
        {rank}
      </div>

      {results && (
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '2rem' }}>
          <Stat label="Score" value={results.total ?? 0} />
          <Stat label="Accuracy" value={`${results.accuracy ?? 0}%`} />
          <Stat label="Max Combo" value={results.combo ?? 0} />
          {results.breakdown && Object.entries(results.breakdown).map(([key, val]) => (
            <Stat key={key} label={key} value={val} />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button onClick={() => navigate(-1)}
          style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', border: 'none', background: 'var(--color-accent)', color: '#fff', fontWeight: 600 }}>
          Play Again
        </button>
        <button onClick={() => navigate('/search')}
          style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', border: '1px solid #444', background: 'transparent', color: 'var(--color-text)' }}>
          New Song
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #2a2a3a' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
