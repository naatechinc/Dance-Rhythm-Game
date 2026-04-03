const express = require('express');
const router = express.Router();
const { version } = require('../../package.json');

/**
 * GET /api/health
 * Returns server health status and version.
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    version,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
