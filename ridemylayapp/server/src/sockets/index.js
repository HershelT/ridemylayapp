const socketIo = require('socket.io');
const jwt = require('../utils/jwt');
const User = require('../models/User');
const Bet = require('../models/Bet');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
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
    logger.info(`New socket connection: ${socket.id} for user: ${socket.user.username}`);    // Store user's socket ID
    activeUsers.set(socket.user.id, socket.id);

    // Update user's online status
    updateUserStatus(socket.user.id, true);

    // Join user to their personal room for direct messages
    socket.join(`user:${socket.user.id}`);

    // Subscribe to notifications
    socket.on('subscribe_notifications', async () => {
      try {
        // Find unread notifications for the user
        const unreadNotifications = await Notification.find({
          recipient: socket.user.id,
          read: false
        }).sort({ createdAt: -1 });

        // Send existing unread notifications
        socket.emit('notifications_init', unreadNotifications);
      } catch (error) {
        logger.error(`Error fetching notifications: ${error.message}`);
        socket.emit('notification_error', 'Failed to load notifications');
      }
    });

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
    });    // Handle new message
    socket.on('new_message', async (message) => {
      try {
        // Broadcast to all users in the chat room
        io.to(`chat:${message.chat}`).emit('message_received', message);

        // Get chat details to create notifications
        const chat = await Chat.findById(message.chat).populate('users');
        
        // Create notifications for offline users and send to online users
        await Promise.all(chat.users
          .filter(user => user._id.toString() !== socket.user.id)
          .map(async (user) => {
            const notification = await Notification.create({
              recipient: user._id,
              sender: socket.user.id,
              type: 'message',
              content: chat.isGroupChat 
                ? `New message in ${chat.name}` 
                : `New message from ${socket.user.username}`,
              entityType: 'chat',
              entityId: chat._id,
              metadata: {
                messageId: message._id,
                preview: message.content.substring(0, 50)
              }
            });

            // If user is online, send notification in real-time
            if (activeUsers.has(user._id.toString())) {
              io.to(`user:${user._id}`).emit('new_notification', notification);
            }
          }));
      } catch (error) {
        logger.error(`Error handling new message: ${error.message}`);
        socket.emit('message_error', 'Failed to process message');
      }
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
    });    // Handle typing indication
    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        userId: socket.user.id,
        username: socket.user.username,
        isTyping
      });
    });

    // Handle read notifications
    socket.on('read_notification', async ({ notificationId }) => {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );
      
      if (notification) {
        socket.emit('notification_updated', notification);
      }
    });

    // Handle bet interactions (like, comment, share)
    socket.on('bet_interaction', async ({ betId, userId, type, data }) => {
      try {
        // Create notification for the bet owner
        const bet = await Bet.findById(betId).populate('userId', 'username');
        
        if (bet && bet.userId._id.toString() !== socket.user.id) {
          const notification = await Notification.create({
            recipient: bet.userId._id,
            sender: socket.user.id,
            type: 'bet_interaction',
            content: `${socket.user.username} ${type}d your bet`,
            entityType: 'bet',
            entityId: betId,
            metadata: { interactionType: type }
          });

          // Send notification to recipient if online
          if (activeUsers.has(bet.userId._id.toString())) {
            io.to(`user:${bet.userId._id}`).emit('new_notification', notification);
          }
        }

        // Broadcast to all relevant users
        io.emit('bet_update', {
          betId,
          userId,
          type, // 'like', 'comment', 'share', 'ride', 'hedge'
          data
      });
    }
        catch (error) {
            logger.error(`Error handling bet interaction: ${error.message}`);
            socket.emit('bet_interaction_error', 'Failed to process bet interaction');
        }
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
