/**
 * moveLibrary.js
 * Canonical metadata for every move in the game.
 * Used by both the frontend (display) and backend (validation/generation).
 *
 * Each entry:
 *   id          - Unique string key (matches choreography JSON)
 *   label       - Human-readable display name
 *   icon        - Emoji shorthand for UI
 *   direction   - Primary spatial axis: 'lateral' | 'vertical' | 'rotational' | 'bilateral'
 *   intensity   - Relative effort: 'low' | 'medium' | 'high'
 *   description - Plain-English cue for players
 *   difficulties - Which difficulty levels include this move
 */

const MOVES = [
  {
    id: 'step_left',
    label: 'Step Left',
    icon: '⬅️',
    direction: 'lateral',
    intensity: 'low',
    description: 'Step your left foot out to the left.',
    difficulties: ['easy', 'intermediate', 'hard'],
  },
  {
    id: 'step_right',
    label: 'Step Right',
    icon: '➡️',
    direction: 'lateral',
    intensity: 'low',
    description: 'Step your right foot out to the right.',
    difficulties: ['easy', 'intermediate', 'hard'],
  },
  {
    id: 'clap',
    label: 'Clap',
    icon: '👏',
    direction: 'bilateral',
    intensity: 'low',
    description: 'Bring both hands together in a clap.',
    difficulties: ['easy', 'intermediate', 'hard'],
  },
  {
    id: 'bounce',
    label: 'Bounce',
    icon: '⬆️',
    direction: 'vertical',
    intensity: 'medium',
    description: 'Bend your knees and bounce up with the beat.',
    difficulties: ['easy', 'intermediate', 'hard'],
  },
  {
    id: 'arm_cross',
    label: 'Arm Cross',
    icon: '🤝',
    direction: 'bilateral',
    intensity: 'medium',
    description: 'Cross both arms in front of your chest.',
    difficulties: ['intermediate', 'hard'],
  },
  {
    id: 'arm_swing',
    label: 'Arm Swing',
    icon: '💪',
    direction: 'lateral',
    intensity: 'medium',
    description: 'Swing both arms from side to side.',
    difficulties: ['intermediate', 'hard'],
  },
  {
    id: 'spin',
    label: 'Spin',
    icon: '🌀',
    direction: 'rotational',
    intensity: 'high',
    description: 'Turn your body 360° in place.',
    difficulties: ['intermediate', 'hard'],
  },
  {
    id: 'pivot',
    label: 'Pivot',
    icon: '↩️',
    direction: 'rotational',
    intensity: 'medium',
    description: 'Pivot 180° on your back foot.',
    difficulties: ['intermediate', 'hard'],
  },
  {
    id: 'point',
    label: 'Point',
    icon: '👆',
    direction: 'bilateral',
    intensity: 'low',
    description: 'Point one hand up and to the beat.',
    difficulties: ['easy', 'intermediate', 'hard'],
  },
  {
    id: 'footwork',
    label: 'Footwork',
    icon: '👟',
    direction: 'lateral',
    intensity: 'high',
    description: 'Quick alternating foot taps — left, right, left.',
    difficulties: ['hard'],
  },
];

/** @type {Map<string, object>} */
const MOVE_MAP = new Map(MOVES.map((m) => [m.id, m]));

/**
 * Get full metadata for a move by ID.
 * @param {string} id
 * @returns {object|undefined}
 */
function getMove(id) {
  return MOVE_MAP.get(id);
}

/**
 * Get all moves valid for a given difficulty level.
 * @param {'easy'|'intermediate'|'hard'} difficulty
 * @returns {object[]}
 */
function getMovesForDifficulty(difficulty) {
  return MOVES.filter((m) => m.difficulties.includes(difficulty));
}

/**
 * Get just the IDs for a difficulty (matches DIFFICULTY_CONFIG.allowedMoves).
 * @param {'easy'|'intermediate'|'hard'} difficulty
 * @returns {string[]}
 */
function getMoveIdsForDifficulty(difficulty) {
  return getMovesForDifficulty(difficulty).map((m) => m.id);
}

module.exports = { MOVES, MOVE_MAP, getMove, getMovesForDifficulty, getMoveIdsForDifficulty };
