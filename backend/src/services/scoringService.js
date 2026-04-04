/**
 * scoringService.js
 * Deterministic scoring engine.
 * The same input stream always produces the same score.
 */

const { TIMING_WINDOWS, SCORE_VALUES, COMBO_MULTIPLIER_THRESHOLD } = require('../../../shared/constants');

/**
 * Evaluate a single input event against a scheduled move window.
 *
 * @param {{ inputTimeSec: number, moveType: string }} inputEvent
 * @param {{ time: number, move: string }} scheduledMove
 * @returns {{ result: 'perfect'|'good'|'okay'|'miss', points: number, delta: number }}
 */
function evaluateHit(inputEvent, scheduledMove) {
  const delta = Math.abs(inputEvent.inputTimeSec - scheduledMove.time);
  const moveMatch = inputEvent.moveType === scheduledMove.move;

  if (!moveMatch) {
    return { result: 'miss', points: 0, delta };
  }

  if (delta <= TIMING_WINDOWS.perfect) {
    return { result: 'perfect', points: SCORE_VALUES.perfect, delta };
  }
  if (delta <= TIMING_WINDOWS.good) {
    return { result: 'good', points: SCORE_VALUES.good, delta };
  }
  if (delta <= TIMING_WINDOWS.okay) {
    return { result: 'okay', points: SCORE_VALUES.okay, delta };
  }
  return { result: 'miss', points: 0, delta };
}

/**
 * Compute a running score state after appending a new hit result.
 *
 * @param {{ total: number, combo: number, streak: number, multiplier: number }} currentScore
 * @param {{ result: string, points: number }} hitResult
 * @returns {object} Updated score state
 */
function applyHit(currentScore, hitResult) {
  const { result, points } = hitResult;
  let { total, combo, streak, multiplier } = currentScore;

  if (result === 'miss') {
    streak = 0;
    multiplier = 1;
    return { total, combo, streak, multiplier };
  }

  streak += 1;
  combo += 1;

  if (combo >= COMBO_MULTIPLIER_THRESHOLD) {
    multiplier = Math.min(4, Math.floor(combo / COMBO_MULTIPLIER_THRESHOLD) + 1);
  }

  total += points * multiplier;

  return { total, combo, streak, multiplier };
}

/**
 * Build a final ScoreSummary from a completed session.
 *
 * @param {PlayerSession} session
 * @returns {ScoreSummary}
 */
function buildSummary(session) {
  const events = session.scoreEvents || [];
  const total = events.reduce((sum, e) => sum + (e.points ?? 0), 0);
  const hits = events.filter((e) => e.result !== 'miss');
  const accuracy = events.length > 0 ? Math.round((hits.length / events.length) * 100) : 0;

  const breakdown = {
    perfect: events.filter((e) => e.result === 'perfect').length,
    good: events.filter((e) => e.result === 'good').length,
    okay: events.filter((e) => e.result === 'okay').length,
    miss: events.filter((e) => e.result === 'miss').length,
  };

  const maxCombo = events.reduce((max, e) => Math.max(max, e.combo ?? 0), 0);

  return {
    sessionId: session.sessionId,
    trackId: session.trackId,
    total,
    accuracy,
    combo: maxCombo,
    breakdown,
    completedAt: new Date().toISOString(),
  };
}

module.exports = { evaluateHit, applyHit, buildSummary };
