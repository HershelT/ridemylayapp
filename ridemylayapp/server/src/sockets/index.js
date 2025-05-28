const socketIo = require('socket.io');
const jwt = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

// Map to store active users' socket IDs
const activeUsers = new Map();

const setupSocketIO = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket.io middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token
      const { valid, decoded, error } = jwt.verifyToken(token);

      if (!valid) {
        logger.warn(`Socket auth: Invalid token: ${error}`);
        return next(new Error('Authentication error: Invalid token'));
      }

      // Find user
      const user = await User.findById(decoded.id);

      if (!user) {
        logger.warn(`Socket auth: User not found for ID: ${decoded.id}`);
        return next(new Error('Authentication error: User not found'));
      }

      // Store user info in socket
      socket.user = {
        id: user._id.toString(),
        username: user.username
      };

      next();
    } catch (error) {
      logger.error(`Socket auth error: ${error.message}`);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`New socket connection: ${socket.id} for user: ${socket.user.username}`);

    // Store user's socket ID
    activeUsers.set(socket.user.id, socket.id);

    // Update user's online status
    updateUserStatus(socket.user.id, true);

    // Join user to their personal room for direct messages
    socket.join(`user:${socket.user.id}`);

    // Handle user disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id} for user: ${socket.user.username}`);
      
      // Remove user from active users
      activeUsers.delete(socket.user.id);
      
      // Update user's online status
      updateUserStatus(socket.user.id, false);
    });

    // Handle joining chat rooms
    socket.on('join_chat', (chatId) => {
      socket.join(`chat:${chatId}`);
      logger.info(`User ${socket.user.username} joined chat room: ${chatId}`);
    });

    // Handle leaving chat rooms
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
      logger.info(`User ${socket.user.username} left chat room: ${chatId}`);
    });

    // Handle new message
    socket.on('new_message', (message) => {
      // Broadcast to all users in the chat room
      io.to(`chat:${message.chat}`).emit('message_received', message);
      
      // Send notification to users who are not in the chat room but are online
      message.chat.users.forEach((userId) => {
        if (userId.toString() !== socket.user.id && activeUsers.has(userId.toString())) {
          io.to(`user:${userId}`).emit('new_notification', {
            type: 'message',
            chatId: message.chat._id,
            senderId: socket.user.id,
            senderName: socket.user.username,
            message: message.content
          });
        }
      });
    });

    // Handle typing indication
    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        userId: socket.user.id,
        username: socket.user.username,
        isTyping
      });
    });

    // Handle bet interactions (like, comment, share)
    socket.on('bet_interaction', ({ betId, userId, type, data }) => {
      // Broadcast to all relevant users
      io.emit('bet_update', {
        betId,
        userId,
        type, // 'like', 'comment', 'share', 'ride', 'hedge'
        data
      });
    });
  });

  // Helper function to update user's online status
  const updateUserStatus = async (userId, isOnline) => {
    try {
      await User.findByIdAndUpdate(userId, {
        lastActive: new Date()
      });
      
      // Broadcast user status update to relevant users
      io.emit('user_status_change', {
        userId,
        isOnline,
        lastActive: new Date()
      });
    } catch (error) {
      logger.error(`Error updating user status: ${error.message}`);
    }
  };

  return io;
};

module.exports = setupSocketIO;
