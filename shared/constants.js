/**
 * constants.js
 * Single source of truth for move definitions, timing windows,
 * scoring values, and difficulty configuration.
 * Used by both frontend and backend.
 */

// ── Move library ──────────────────────────────────────────────────────────────
const MOVE_LIBRARY = [
  'step_left',
  'step_right',
  'arm_cross',
  'arm_swing',
  'spin',
  'bounce',
  'clap',
  'point',
  'footwork',
  'pivot',
];

// ── Timing windows (seconds) ─────────────────────────────────────────────────
const TIMING_WINDOWS = {
  perfect: 0.15, // ±150ms
  good:    0.30, // ±300ms
  okay:    0.50, // ±500ms
  // anything outside okay = miss
};

// ── Base score values per tier ────────────────────────────────────────────────
const SCORE_VALUES = {
  perfect: 300,
  good:    200,
  okay:    100,
  miss:    0,
};

// ── Combo multiplier kicks in after N consecutive non-miss hits ───────────────
const COMBO_MULTIPLIER_THRESHOLD = 5;

// ── Difficulty configuration ──────────────────────────────────────────────────
const DIFFICULTY_CONFIG = {
  easy: {
    intervalSec:   2.5,
    comboLength:   2,
    allowedMoves:  ['step_left', 'step_right', 'clap', 'bounce'],
  },
  intermediate: {
    intervalSec:   1.8,
    comboLength:   3,
    allowedMoves:  MOVE_LIBRARY,
  },
  hard: {
    intervalSec:   1.2,
    comboLength:   5,
    allowedMoves:  MOVE_LIBRARY,
  },
};

// ── Session statuses ──────────────────────────────────────────────────────────
const SESSION_STATUS = {
  WAITING:  'waiting',
  PLAYING:  'playing',
  PAUSED:   'paused',
  FINISHED: 'finished',
};

// ── Score rank thresholds (accuracy %) ───────────────────────────────────────
const RANK_THRESHOLDS = [
  { rank: 'S', min: 95 },
  { rank: 'A', min: 80 },
  { rank: 'B', min: 65 },
  { rank: 'C', min: 0  },
];

module.exports = {
  MOVE_LIBRARY,
  TIMING_WINDOWS,
  SCORE_VALUES,
  COMBO_MULTIPLIER_THRESHOLD,
  DIFFICULTY_CONFIG,
  SESSION_STATUS,
  RANK_THRESHOLDS,
};
