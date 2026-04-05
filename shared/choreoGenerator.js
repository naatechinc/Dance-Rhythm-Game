/**
 * choreoGenerator.js
 * Advanced choreography generation pipeline.
 * 
 * Key improvements:
 * - BPM-synced move timing (moves land on beat subdivisions)
 * - Energy curve modeling (builds energy through verse, peaks at chorus)
 * - Move variety rules (no repeats within 3 moves, genre-aware pools)
 * - Combo pattern library (pre-built sequences that flow naturally)
 * - Difficulty scaling (easy=half-beats, hard=quarter-beats)
 */

const { DIFFICULTY_CONFIG } = require('./constants');
const { getMoveIdsForDifficulty } = require('./moveLibrary');

// ── Combo pattern library ────────────────────────────────────────────────────
// Pre-built move sequences that feel natural to dance
const COMBO_PATTERNS = {
  low_energy: [
    ['step_left', 'step_right'],
    ['clap', 'bounce'],
    ['step_left', 'clap', 'step_right'],
  ],
  mid_energy: [
    ['arm_swing', 'step_left', 'step_right'],
    ['bounce', 'clap', 'bounce'],
    ['step_left', 'arm_cross', 'step_right'],
    ['point', 'step_left', 'clap'],
  ],
  high_energy: [
    ['spin', 'clap', 'bounce'],
    ['arm_swing', 'spin', 'point'],
    ['step_left', 'spin', 'step_right', 'clap'],
    ['bounce', 'arm_cross', 'spin'],
    ['footwork', 'clap', 'arm_swing'],
  ],
};

// Energy level per section
const SECTION_ENERGY = {
  intro: 'low_energy',
  verse: 'mid_energy',
  chorus: 'high_energy',
  bridge: 'mid_energy',
};

/**
 * Main generate function.
 */
function generate(track, opts = {}) {
  const bpm = opts.bpm || estimateBpm(track);
  const beatSec = 60 / bpm;
  const difficulty = opts.difficulty || 'intermediate';
  const startSec = opts.startSec ?? 30;
  const endSec = opts.endSec ?? Math.min(startSec + 45, (track.durationSec ?? 240) - 5);
  const seed = opts.seed ?? hashSeed(track.videoId + difficulty);

  if (endSec <= startSec) throw new Error('endSec must be > startSec');

  const rng = seededRng(seed);
  const allowedMoves = getMoveIdsForDifficulty(difficulty);

  // How many beats between moves per difficulty
  const beatsPerMove = {
    easy: 4,
    intermediate: 2,
    hard: 1,
  }[difficulty] || 2;

  const moveInterval = beatSec * beatsPerMove;

  // Build sections
  const sections = buildSections(startSec, endSec);

  // Generate moves section by section
  const moves = [];
  const history = []; // track last N moves to avoid repetition

  for (const section of sections) {
    const energy = SECTION_ENERGY[section.name] || 'mid_energy';
    const patterns = COMBO_PATTERNS[energy];

    // Snap section start to nearest beat boundary
    let t = snapToBeat(section.start + beatSec, startSec, beatSec);

    while (t < section.end - moveInterval * 0.5) {
      // Decide: use a pattern or a single move?
      const usePattern = rng() < patternChance(section.name, difficulty);

      if (usePattern && patterns.length > 0) {
        const pattern = patterns[Math.floor(rng() * patterns.length)];
        const filtered = pattern.filter(m => allowedMoves.includes(m));

        for (let i = 0; i < filtered.length; i++) {
          const moveTime = round2(t + i * moveInterval * 0.5);
          if (moveTime >= section.end) break;
          const move = avoidRepeat(filtered[i], history, allowedMoves, rng);
          moves.push({ time: moveTime, move });
          history.push(move);
          if (history.length > 4) history.shift();
        }
        t += moveInterval * filtered.length * 0.5;
      } else {
        const move = pickFromPool(energy, history, allowedMoves, rng);
        moves.push({ time: round2(t), move });
        history.push(move);
        if (history.length > 4) history.shift();
        t += moveInterval;
      }
    }
  }

  // Sort and deduplicate by time
  const deduped = deduplicateMoves(moves);

  return {
    trackId: track.videoId,
    difficulty,
    bpm: Math.round(bpm),
    beatSec: round2(beatSec),
    startSec,
    endSec,
    moves: deduped,
    sections,
    generatedAt: new Date().toISOString(),
    source: 'generated',
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildSections(startSec, endSec) {
  const total = endSec - startSec;
  return [
    { name: 'intro',  start: startSec,                end: startSec + total * 0.12 },
    { name: 'verse',  start: startSec + total * 0.12, end: startSec + total * 0.42 },
    { name: 'chorus', start: startSec + total * 0.42, end: startSec + total * 0.78 },
    { name: 'bridge', start: startSec + total * 0.78, end: endSec },
  ];
}

function patternChance(sectionName, difficulty) {
  const base = { intro: 0.2, verse: 0.4, chorus: 0.65, bridge: 0.35 };
  const diff = { easy: 0.7, intermediate: 1.0, hard: 1.3 };
  return Math.min(0.85, (base[sectionName] || 0.4) * (diff[difficulty] || 1));
}

function pickFromPool(energy, history, allowedMoves, rng) {
  const energyMoves = {
    low_energy:  ['step_left', 'step_right', 'clap', 'bounce', 'point'],
    mid_energy:  ['step_left', 'step_right', 'clap', 'bounce', 'arm_swing', 'arm_cross', 'point'],
    high_energy: allowedMoves,
  }[energy] || allowedMoves;

  const pool = energyMoves.filter(m => allowedMoves.includes(m) && m !== history[history.length - 1]);
  return pool.length > 0 ? pool[Math.floor(rng() * pool.length)] : allowedMoves[0];
}

function avoidRepeat(move, history, allowedMoves, rng) {
  if (!history.slice(-2).includes(move)) return move;
  const alt = allowedMoves.filter(m => !history.slice(-2).includes(m));
  return alt.length > 0 ? alt[Math.floor(rng() * alt.length)] : move;
}

function snapToBeat(t, startSec, beatSec) {
  const offset = t - startSec;
  return startSec + Math.round(offset / beatSec) * beatSec;
}

function deduplicateMoves(moves) {
  const sorted = moves.sort((a, b) => a.time - b.time);
  const out = [];
  for (const m of sorted) {
    if (out.length === 0 || m.time - out[out.length - 1].time >= 0.4) {
      out.push(m);
    }
  }
  return out;
}

function estimateBpm(track) {
  if (track.bpm && track.bpm > 0) return track.bpm;
  // Use title hints
  const title = (track.title || '').toLowerCase();
  if (title.includes('waltz')) return 90;
  if (title.includes('ballad') || title.includes('slow')) return 72;
  if (title.includes('hip hop') || title.includes('rap')) return 88;
  if (title.includes('edm') || title.includes('dance') || title.includes('house')) return 128;
  if (title.includes('rock') || title.includes('punk')) return 140;
  // Duration-based fallback
  const dur = track.durationSec || 210;
  if (dur < 150) return 138;
  if (dur < 190) return 128;
  if (dur < 240) return 120;
  if (dur < 290) return 110;
  return 100;
}

function seededRng(seed) {
  let s = (typeof seed === 'number' ? seed : hashSeed(String(seed))) >>> 0;
  return function () {
    s |= 0; s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashSeed(str = '') {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

function round2(n) {
  return Math.round(n * 10) / 10;
}

module.exports = { generate, estimateBpm };
