const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  changePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.get('/me/bets', protect, (req, res, next) => {
  req.params.username = 'me';
  require('../controllers/userController').getUserBets(req, res, next);
});
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
