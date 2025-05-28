const express = require('express');
const router = express.Router();
const { 
  getBettingSites, 
  getBettingSite, 
  createBettingSite, 
  updateBettingSite, 
  deleteBettingSite 
} = require('../controllers/bettingSiteController');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.get('/', getBettingSites);
router.get('/:id', getBettingSite);

// Admin routes
router.post('/', protect, admin, createBettingSite);
router.put('/:id', protect, admin, updateBettingSite);
router.delete('/:id', protect, admin, deleteBettingSite);

module.exports = router;
