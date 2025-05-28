const express = require('express');
const router = express.Router();
const { 
  getUserProfile, 
  getUserBets, 
  toggleFollow, 
  getLeaderboard 
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/:username', getUserProfile);
router.get('/:username/bets', getUserBets);

// Protected routes
router.put('/:username/follow', protect, toggleFollow);

module.exports = router;
