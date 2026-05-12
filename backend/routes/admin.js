const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const {
  getOverview,
  getUsers,
  getUnknown,
  getAchievements,
  getGames
} = require('../controllers/adminController');

// Admin routes — mounted at /api/admin in server.js
router.get('/overview', adminAuth, getOverview);
router.get('/users', adminAuth, getUsers);
router.get('/unknown', adminAuth, getUnknown);
router.get('/achievements', adminAuth, getAchievements);
router.get('/games', adminAuth, getGames);

module.exports = router;
