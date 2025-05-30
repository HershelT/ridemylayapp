const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Bet = require('../models/Bet');
const logger = require('../utils/logger');

// Track online users
const onlineUsers = new Map();

// Setup socket.io with the server
const setupSocketIO = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [process.env.CLIENT_URL, 'https://www.ridemylay.com', 'https://ride-my-lay.vercel.app']
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        logger.warn(`Socket auth: User not found for ID: ${decoded.id}`);
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      
      // Update user's last active time
      await User.findByIdAndUpdate(user._id, { lastActive: new Date() });
      
      next();
    } catch (error) {
      logger.error(`Socket auth error: ${error.message}`);
      next(new Error('Authentication error'));
    }
  });

  // Handle connection
  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    
    logger.info(`User connected: ${socket.user.username} (${userId})`);
    
    // Add user to online users map
    onlineUsers.set(userId, socket.id);
    
    // Update user's online status
    await User.findByIdAndUpdate(userId, { 
      lastActive: new Date(),
      'status.isOnline': true
    });
    
    // Emit user status change to all sockets
    io.emit('user_status_change', { 
      userId, 
      username: socket.user.username,
      isOnline: true 
    });
    
    // Handle ping to keep connection alive
    socket.on('ping', () => {
      socket.emit('pong');
    });
    
    // Handle notification subscription
    socket.on('subscribe_notifications', async () => {
      try {
        // Find unread notifications for the user
        const unreadNotifications = await Notification.find({
          recipient: socket.user.id,
          read: false
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'username avatarUrl')
        .limit(30);

        // Send existing unread notifications
        socket.emit('notifications_init', unreadNotifications);
        
        // Keep track of subscribed users
        socket.join('notifications:' + socket.user.id);
        
        logger.info(`User ${socket.user.username} subscribed to notifications`);
      } catch (error) {
        logger.error(`Error fetching notifications: ${error.message}`);
        socket.emit('notification_error', 'Failed to load notifications');
      }
    });
    
    socket.on('unsubscribe_notifications', () => {
      socket.leave('notifications:' + socket.user.id);
      logger.info(`User ${socket.user.username} unsubscribed from notifications`);
    });

    // Handle new messages
    socket.on('new_message', async (message) => {
      try {
        if (!message.chat) {
          return;
        }
        
        // Broadcast to all users in the chat room except sender
        socket.to('chat:' + message.chat).emit('message_received', message);
        
        // Also create notifications for offline users
        // Get chat users excluding sender
        const chat = await Chat.findById(message.chat);
        if (!chat) return;
        
        for (const userId of chat.users) {
          // Skip the sender
          if (userId.toString() === socket.user.id) continue;
          
          // Check if user is online and in the chat room
          const userSocketId = onlineUsers.get(userId.toString());
          
          // If user is not online or not in this chat, create notification
          if (!userSocketId || !io.sockets.adapter.rooms.get('chat:' + message.chat)?.has(userSocketId)) {
            // Create notification
            const notification = await Notification.create({
              recipient: userId,
              sender: socket.user.id,
              type: 'message',
              content: message.content || 'New message',
              entityType: 'chat',
              entityId: message.chat,
              metadata: { messageId: message._id }
            });
            
            // If user is online but not in chat, send notification
            if (userSocketId) {
              io.to(userSocketId).emit('new_notification', notification);
            }
          }
        }
      } catch (error) {
        logger.error(`Error handling new message: ${error.message}`);
      }
});
    
    // Handle chat room operations
    socket.on('join_chat', (chatId) => {
      socket.join('chat:' + chatId);
      logger.info(`User ${socket.user.username} joined chat ${chatId}`);
    });
    
    socket.on('leave_chat', (chatId) => {
      socket.leave('chat:' + chatId);
      logger.info(`User ${socket.user.username} left chat ${chatId}`);
    });
    
    // Handle typing notifications
    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to('chat:' + chatId).emit('user_typing', {
        userId: socket.user.id,
        username: socket.user.username,
        isTyping
      });
    });
    
    // Handle read messages
    socket.on('read_messages', async (chatId) => {
      try {
        // Mark messages as read
        await Message.updateMany(
          { 
            chat: chatId, 
            sender: { $ne: socket.user.id },
            readBy: { $ne: socket.user.id }
          },
          { $addToSet: { readBy: socket.user.id } }
        );
        
        // Notify other users in the chat
        socket.to('chat:' + chatId).emit('messages_read', {
          chatId,
          userId: socket.user.id
        });
        
        logger.info(`User ${socket.user.username} marked messages as read in chat ${chatId}`);
      } catch (error) {
        logger.error(`Error marking messages as read: ${error.message}`);
      }
    });
    
    // Handle read notification
    socket.on('read_notification', async ({ notificationId }) => {
      try {
        await Notification.findByIdAndUpdate(notificationId, { read: true });
        
        // Emit notification count updated event
        socket.emit('notification_count_updated');
        
        logger.info(`User ${socket.user.username} marked notification ${notificationId} as read`);
      } catch (error) {
        logger.error(`Error marking notification as read: ${error.message}`);
      }
    });
    
    // Handle bet interactions
    socket.on('bet_interaction', async ({ betId, type, data }) => {
      try {
        // Log interaction for analytics
        logger.info(`Bet interaction: ${socket.user.username} ${type} bet ${betId}`);
        
        // Could implement detailed analytics tracking here
      } catch (error) {
        logger.error(`Error processing bet interaction: ${error.message}`);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${socket.user.username} (${userId})`);
      
      // Remove user from online users map
      onlineUsers.delete(userId);
      
      // Update user's online status
      await User.findByIdAndUpdate(userId, {
        lastActive: new Date(),
        'status.isOnline': false
      });
      
      // Emit user status change to all sockets
      io.emit('user_status_change', { 
        userId, 
        username: socket.user.username,
        isOnline: false 
      });
    });
  });

  // Utility function to send notification
  io.sendNotification = async (notification) => {
    try {
      // Find recipient's socket if they're online
      const recipientSocketId = onlineUsers.get(notification.recipient.toString());
      
      if (recipientSocketId) {
        // Emit to specific user
        io.to(recipientSocketId).emit('new_notification', notification);
        
        // Also emit to user's notification room for multi-tab support
        io.to('notifications:' + notification.recipient).emit('new_notification', notification);
      }
      
      // We always save the notification to database even if user is offline
      return true;
    } catch (error) {
      logger.error(`Error sending notification: ${error.message}`);
      return false;
    }
  };

  return io;
};

module.exports = setupSocketIO;