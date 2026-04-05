const express = require('express');
const router = express.Router();
const choreoService = require('../services/choreoService');
const sessionService = require('../services/sessionService');
const { getBpmForTrack } = require('../services/spotifyService');

/**
 * GET /api/choreo/:trackId
 * Fetches real BPM from Spotify, then generates beat-synced choreography.
 */
router.get('/:trackId', async (req, res) => {
  const { trackId } = req.params;
  const { difficulty = 'intermediate', startSec, endSec } = req.query;

  try {
    // Try to get track metadata for better BPM detection
    // Look it up from any active session that has this track
    let title = req.query.title || '';
    let artist = req.query.artist || '';

    // Fetch real BPM from Spotify
    let spotifyData = null;
    if (title) {
      spotifyData = await getBpmForTrack(title, artist);
    }

    const bpm = spotifyData?.bpm || null;
    const energy = spotifyData?.energy || null;

    // Map Spotify energy to difficulty if not specified
    let effectiveDifficulty = difficulty;
    if (energy !== null && difficulty === 'intermediate') {
      if (energy > 0.8) effectiveDifficulty = 'hard';
      else if (energy < 0.4) effectiveDifficulty = 'easy';
    }

    const choreo = await choreoService.getChoreography(trackId, {
      difficulty: effectiveDifficulty,
      startSec: startSec ? Number(startSec) : undefined,
      endSec: endSec ? Number(endSec) : undefined,
      bpm,
    });

    if (!choreo) {
      return res.status(404).json({ error: 'Choreography not found for this track.' });
    }

    // Attach Spotify metadata to response
    res.json({
      ...choreo,
      spotifyBpm: bpm,
      spotifyEnergy: energy,
      spotifyDanceability: spotifyData?.danceability || null,
    });
  } catch (err) {
    console.error('[choreo] error:', err.message);
    res.status(500).json({ error: 'Failed to load choreography.' });
  }
});

module.exports = router;
