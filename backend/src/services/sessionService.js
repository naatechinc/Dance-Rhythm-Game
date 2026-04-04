/**
 * sessionService.js
 * In-memory session store for MVP. Replace with a database for production.
 */

const { v4: uuidv4 } = require('uuid');

/** @type {Map<string, PlayerSession>} */
const sessions = new Map();

/**
 * Create a new game session.
 * @param {string} trackId
 * @param {object} track - Full TrackMetadata
 * @returns {PlayerSession}
 */
function createSession(trackId, track = {}) {
  const sessionId = uuidv4();
  const session = {
    sessionId,
    trackId,
    track,
    status: 'waiting', // waiting | playing | paused | finished
    currentTimeSec: 0,
    players: [],
    scoreEvents: [],
    createdAt: Date.now(),
  };
  sessions.set(sessionId, session);
  return session;
}

/**
 * Retrieve a session by ID.
 * @param {string} sessionId
 * @returns {PlayerSession|null}
 */
function getSession(sessionId) {
  return sessions.get(sessionId) ?? null;
}

/**
 * Update fields on a session.
 * @param {string} sessionId
 * @param {Partial<PlayerSession>} updates
 * @returns {PlayerSession|null}
 */
function updateSession(sessionId, updates) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  Object.assign(session, updates);
  return session;
}

/**
 * Add a player to a session.
 * @param {string} sessionId
 * @param {string} playerId
 */
function addPlayer(sessionId, playerId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (!session.players.includes(playerId)) {
    session.players.push(playerId);
  }
  return session;
}

/**
 * Remove a player from a session.
 */
function removePlayer(sessionId, playerId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.players = session.players.filter((p) => p !== playerId);
  return session;
}

/**
 * Append a scored input event to a session.
 */
function recordScoreEvent(sessionId, event) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.scoreEvents.push(event);
  return session;
}

/**
 * Delete a session (cleanup after results retrieved).
 */
function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  addPlayer,
  removePlayer,
  recordScoreEvent,
  deleteSession,
};
