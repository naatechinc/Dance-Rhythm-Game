/**
 * choreoService.js
 * Returns choreography for a track. Priority:
 *   1. Cached JSON file in /data/choreography/
 *   2. AI generation (when ENABLE_AI_CHOREO=true) — stub for now
 *   3. Fallback test sequence
 */

const fs = require('fs');
const path = require('path');
const { DIFFICULTY_CONFIG } = require('../../../shared/constants');
const { generate } = require('../../../shared/choreoGenerator');

const CHOREO_DIR = path.join(__dirname, '../../../data/choreography');

/**
 * @param {string} trackId
 * @param {{ difficulty?: string, startSec?: number, endSec?: number }} opts
 * @returns {Promise<ChoreographySegment|null>}
 */
async function getChoreography(trackId, opts = {}) {
  const { difficulty = 'intermediate', startSec = 30, endSec = 72 } = opts;

  // 1. Try cache
  const cachePath = path.join(CHOREO_DIR, `${trackId}.json`);
  if (process.env.ENABLE_CHOREO_CACHE !== 'false' && fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    return filterSegment(cached, startSec, endSec);
  }

  // 2. AI generation (future)
  if (process.env.ENABLE_AI_CHOREO === 'true') {
    // TODO: call AI choreography generator
    throw new Error('AI choreo generation not yet implemented.');
  }

  // 3. Fallback: procedurally generate a simple sequence
  return generateFallback(trackId, { difficulty, startSec, endSec });
}

/**
 * Filter an existing choreography object to the requested time window.
 */
function filterSegment(choreo, startSec, endSec) {
  return {
    ...choreo,
    startSec,
    endSec,
    moves: choreo.moves.filter((m) => m.time >= startSec && m.time <= endSec),
  };
}

/**
 * Generate a deterministic fallback routine using the shared move library.
 */
function generateFallback(trackId, { difficulty, startSec, endSec }) {
  return generate(
    { videoId: trackId },
    { difficulty, startSec, endSec }
  );
}

/**
 * Persist generated choreography to the cache directory.
 */
function cacheChoreography(trackId, choreo) {
  if (!fs.existsSync(CHOREO_DIR)) fs.mkdirSync(CHOREO_DIR, { recursive: true });
  const cachePath = path.join(CHOREO_DIR, `${trackId}.json`);
  fs.writeFileSync(cachePath, JSON.stringify(choreo, null, 2));
}

module.exports = { getChoreography, cacheChoreography };
