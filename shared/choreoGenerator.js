/**
 * choreoGenerator.js
 * Pure choreography generation logic — no I/O, no caching.
 * Takes track metadata + options, returns a ChoreographySegment.
 *
 * Generation pipeline (TDD §9):
 *   1. Input validation
 *   2. Phrase boundary analysis (intro / verse / chorus / bridge)
 *   3. Move sequence generation using difficulty rules
 *   4. Validation — spacing, transitions, density
 *   5. Output as ChoreographySegment
 */

const { DIFFICULTY_CONFIG } = require('./constants');
const { getMoveIdsForDifficulty } = require('./moveLibrary');

/**
 * Generate a choreography segment for a track.
 *
 * @param {{
 *   videoId: string,
 *   title?: string,
 *   artist?: string,
 *   durationSec?: number,
 *   bpm?: number,
 * }} track
 * @param {{
 *   difficulty?: string,
 *   startSec?: number,
 *   endSec?: number,
 *   seed?: number,
 * }} opts
 * @returns {ChoreographySegment}
 */
function generate(track, opts = {}) {
  const {
    difficulty = 'intermediate',
    startSec = 30,
    endSec = Math.min(startSec + 42, (track.durationSec ?? 240) - 5),
    seed = hashSeed(track.videoId),
  } = opts;

  const config = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.intermediate;
  const allowedMoves = getMoveIdsForDifficulty(difficulty);

  // Validate inputs
  if (endSec <= startSec) {
    throw new Error(`endSec (${endSec}) must be greater than startSec (${startSec})`);
  }
  if (allowedMoves.length === 0) {
    throw new Error(`No moves available for difficulty: ${difficulty}`);
  }

  // Identify phrase sections
  const sections = buildSections(startSec, endSec);

  // Generate move sequence
  const moves = buildMoveSequence({
    sections,
    config,
    allowedMoves,
    seed,
    difficulty,
  });

  // Validate spacing
  validateSpacing(moves, config.intervalSec);

  return {
    trackId: track.videoId,
    difficulty,
    startSec,
    endSec,
    moves,
    sections,
    generatedAt: new Date().toISOString(),
    source: 'generated',
  };
}

// ── Internals ─────────────────────────────────────────────────────────────────

/**
 * Divide the time window into phrase sections (intro / verse / chorus / bridge).
 */
function buildSections(startSec, endSec) {
  const total = endSec - startSec;
  return [
    { name: 'intro',  start: startSec,               end: startSec + total * 0.15 },
    { name: 'verse',  start: startSec + total * 0.15, end: startSec + total * 0.45 },
    { name: 'chorus', start: startSec + total * 0.45, end: startSec + total * 0.80 },
    { name: 'bridge', start: startSec + total * 0.80, end: endSec },
  ];
}

/**
 * Build the ordered list of timed MoveEvents.
 */
function buildMoveSequence({ sections, config, allowedMoves, seed, difficulty }) {
  const moves = [];
  let rng = seededRng(seed);

  for (const section of sections) {
    // Chorus gets tighter intervals for high energy
    const interval = section.name === 'chorus'
      ? config.intervalSec * 0.85
      : config.intervalSec;

    // Intro starts slower
    const effectiveInterval = section.name === 'intro'
      ? interval * 1.4
      : interval;

    let t = section.start + 0.5; // small lead-in before first prompt

    while (t < section.end - 0.5) {
      const moveId = pickMove(allowedMoves, moves, rng, section.name);
      moves.push({ time: round2(t), move: moveId });

      // Combo bursts: occasionally chain a second move with safe spacing
      const comboChance = difficulty === 'hard' ? 0.25 : difficulty === 'intermediate' ? 0.15 : 0;
      const safeComboGap = effectiveInterval * 0.65;
      if (rng() < comboChance && t + safeComboGap < section.end - 0.5) {
        t += safeComboGap;
        const comboMove = pickMove(allowedMoves, moves, rng, section.name);
        moves.push({ time: round2(t), move: comboMove });
      }

      t += effectiveInterval;
    }
  }

  return moves.sort((a, b) => a.time - b.time);
}

/**
 * Pick a move that doesn't immediately repeat the last one.
 */
function pickMove(allowedMoves, existing, rng, sectionName) {
  const last = existing[existing.length - 1]?.move;

  // In chorus, prefer higher-energy moves
  const pool = sectionName === 'chorus'
    ? allowedMoves.filter((m) => !['step_left', 'step_right'].includes(m))
    : allowedMoves;

  const candidates = pool.filter((m) => m !== last);
  const src = candidates.length > 0 ? candidates : allowedMoves;
  return src[Math.floor(rng() * src.length)];
}

/**
 * Ensure no two consecutive moves are closer than minGap seconds.
 * Throws if spacing is too tight for playability.
 */
function validateSpacing(moves, minInterval) {
  const MIN_GAP = minInterval * 0.5;
  for (let i = 1; i < moves.length; i++) {
    const gap = moves[i].time - moves[i - 1].time;
    if (gap < MIN_GAP - 0.05) {  // 50ms tolerance for floating point
      throw new Error(
        `Move spacing violation: ${moves[i - 1].move} → ${moves[i].move} at ${moves[i].time}s ` +
        `(gap ${gap.toFixed(2)}s < min ${MIN_GAP.toFixed(2)}s)`
      );
    }
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Deterministic seeded PRNG (mulberry32). */
function seededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Simple string → number hash for reproducible seeds from video IDs. */
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

module.exports = { generate };
