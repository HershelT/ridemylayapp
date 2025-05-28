const express = require('express');
const router = express.Router();
const { 
  createBet, 
  getBets, 
  getBet, 
  updateBetStatus, 
  toggleLike, 
  getBetComments, 
  addComment 
} = require('../controllers/betController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getBets);
router.get('/:id', getBet);
router.get('/:id/comments', getBetComments);

// Protected routes
router.post('/', protect, createBet);
router.put('/:id/status', protect, updateBetStatus);
router.put('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addComment);

module.exports = router;
