const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authRoutes');
const betRoutes = require('./betRoutes');
const userRoutes = require('./userRoutes');
const chatRoutes = require('./chatRoutes');
const messageRoutes = require('./messageRoutes');
const bettingSiteRoutes = require('./bettingSiteRoutes');
const notificationRoutes = require('./notificationRoutes');
const commentRoutes = require('./commentRoutes'); // Added new comment routes

// Mount routes
router.use('/auth', authRoutes);
router.use('/bets', betRoutes);
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/betting-sites', bettingSiteRoutes);
router.use('/notifications', notificationRoutes);
router.use('/comments', commentRoutes); // Mount the new comment routes

module.exports = router;
