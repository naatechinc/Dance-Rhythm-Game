const express = require('express');
const router = express.Router();
const choreoService = require('../services/choreoService');

/**
 * GET /api/choreo/:trackId
 * Returns the choreography segment for a given track.
 * Query params: difficulty (easy | intermediate | hard), startSec, endSec
 */
router.get('/:trackId', async (req, res) => {
  const { trackId } = req.params;
  const { difficulty = 'intermediate', startSec, endSec } = req.query;

  try {
    const choreo = await choreoService.getChoreography(trackId, {
      difficulty,
      startSec: startSec ? Number(startSec) : undefined,
      endSec: endSec ? Number(endSec) : undefined,
    });

    if (!choreo) {
      return res.status(404).json({ error: 'Choreography not found for this track.' });
    }

    res.json(choreo);
  } catch (err) {
    console.error('[choreo] error:', err.message);
    res.status(500).json({ error: 'Failed to load choreography.' });
  }
});

module.exports = router;
