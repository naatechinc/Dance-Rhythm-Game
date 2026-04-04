import React, { useEffect, useState } from 'react';

const FEEDBACK_CONFIG = {
  perfect: { label: 'PERFECT!', color: '#ffd600', scale: 1.2 },
  good:    { label: 'GOOD',     color: '#00e676', scale: 1.1 },
  okay:    { label: 'OKAY',     color: '#40c4ff', scale: 1.0 },
  miss:    { label: 'MISS',     color: '#ff5252', scale: 0.95 },
};

/**
 * ComboFeedback
 * Displays a brief animated label when a move is scored.
 * Pass `result` as one of: 'perfect' | 'good' | 'okay' | 'miss' | null
 */
export default function ComboFeedback({ result }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    if (!result) return;
    setCurrent(result);
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(timer);
  }, [result]);

  if (!visible || !current) return null;

  const cfg = FEEDBACK_CONFIG[current] ?? FEEDBACK_CONFIG.okay;

  return (
    <div
      style={{
        position: 'fixed',
        top: '38%',
        left: '50%',
        transform: `translateX(-50%) scale(${cfg.scale})`,
        color: cfg.color,
        fontSize: '2rem',
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        textShadow: `0 0 20px ${cfg.color}88`,
        pointerEvents: 'none',
        zIndex: 100,
        animation: 'comboPop 0.7s ease forwards',
      }}
    >
      {cfg.label}
      <style>{`
        @keyframes comboPop {
          0%   { opacity: 0; transform: translateX(-50%) scale(0.7); }
          20%  { opacity: 1; transform: translateX(-50%) scale(${cfg.scale}); }
          70%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) scale(${cfg.scale}) translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
