const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const scoringService = require('../services/scoringService');

/**
 * POST /api/session
 * Creates a new game session for a selected track.
 * Body: { trackId: string, track: TrackMetadata }
 */
router.post('/', (req, res) => {
  const { trackId, track } = req.body;
  if (!trackId) return res.status(400).json({ error: 'trackId is required' });

  const session = sessionService.createSession(trackId, track);
  res.status(201).json({ sessionId: session.sessionId, trackId: session.trackId, status: session.status });
});

/**
 * GET /api/session/:sessionId
 * Returns the current state of a session.
 */
router.get('/:sessionId', (req, res) => {
  const session = sessionService.getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

/**
 * GET /api/session/:sessionId/results
 * Returns the final score summary for a completed session.
 */
router.get('/:sessionId/results', (req, res) => {
  const session = sessionService.getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const summary = scoringService.buildSummary(session);
  res.json(summary);
});

/**
 * PATCH /api/session/:sessionId
 * Updates session status (e.g., playing → finished).
 * Body: { status: string }
 */
router.patch('/:sessionId', (req, res) => {
  const { status } = req.body;
  const session = sessionService.updateSession(req.params.sessionId, { status });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

module.exports = router;
