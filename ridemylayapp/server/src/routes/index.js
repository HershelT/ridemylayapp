const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authRoutes');
const betRoutes = require('./betRoutes');
const userRoutes = require('./userRoutes');
const chatRoutes = require('./chatRoutes');
const messageRoutes = require('./messageRoutes');
const bettingSiteRoutes = require('./bettingSiteRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/bets', betRoutes);
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/betting-sites', bettingSiteRoutes);

module.exports = router;
