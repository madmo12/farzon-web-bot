const express = require('express');
const router = express.Router();
const { getStats, trackEvent } = require('../controllers/statsController');

router.get('/stats/:sessionId', getStats);
router.post('/stats/track', trackEvent);

module.exports = router;
