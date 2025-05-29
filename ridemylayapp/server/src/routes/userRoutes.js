const express = require('express');
const router = express.Router();
const { 
  getUserProfile, 
  getUserBets, 
  toggleFollow, 
  getLeaderboard,
  searchUsers,
  getUserFollowers,
  getUserFollowing
} = require('../controllers/userController');
const { getUserAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/search', searchUsers);
router.get('/leaderboard', protect, getLeaderboard); // Make it protected to support friend filtering
router.get('/:username', getUserProfile);
router.get('/:username/bets', getUserBets);

// Protected routes
router.put('/:username/follow', protect, toggleFollow);
router.get('/:username/analytics', protect, getUserAnalytics);

// Followers/Following routes
router.get('/:userId/followers', getUserFollowers);
router.get('/:userId/following', getUserFollowing);

module.exports = router;
