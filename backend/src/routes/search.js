const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');

/**
 * GET /api/search?q=<query>
 * Returns a list of playable video results.
 */
router.get('/', async (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Missing query parameter: q' });
  }

  try {
    const results = await searchService.search(q.trim());
    res.json({ results });
  } catch (err) {
    console.error('[search] error:', err.message);
    res.status(502).json({ error: 'Search failed. Please try again.' });
  }
});

module.exports = router;
