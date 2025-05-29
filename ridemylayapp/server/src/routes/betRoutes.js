const express = require('express');
const router = express.Router();
const { 
  createBet, 
  getBets, 
  getBet, 
  updateBetStatus, 
  toggleLike, 
  getBetComments, 
  addComment,
  deleteBet
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
router.delete('/:id', protect, deleteBet);

// Test route for creating sample bets
router.post('/sample-bets', protect, async (req, res) => {
  try {
    // Create sample bets for the current user
    const sampleBets = [
      {
        userId: req.user.id,
        legs: [{
          team: 'Test Team 1',
          betType: 'moneyline',
          odds: 2.0,
          outcome: 'won'
        }],
        odds: 2.0,
        stake: 100,
        potentialWinnings: 200,
        status: 'won',
        createdAt: new Date()
      },
      {
        userId: req.user.id,
        legs: [{
          team: 'Test Team 2',
          betType: 'moneyline',
          odds: 1.5,
          outcome: 'lost'
        }],
        odds: 1.5,
        stake: 100,
        potentialWinnings: 150,
        status: 'lost',
        createdAt: new Date()
      }
    ];

    await Bet.insertMany(sampleBets);
    res.status(200).json({ success: true, message: 'Sample bets created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
