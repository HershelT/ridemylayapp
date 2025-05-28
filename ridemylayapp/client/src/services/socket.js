import { io } from 'socket.io-client';

let socket;

export const initializeSocket = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('No auth token found, socket connection not established');
    return null;
  }
  
  if (!socket) {
    // Connect to the socket server with authentication
    socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token,
      },
      transports: ['websocket'],
      autoConnect: true,
    });
    
    // Socket connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      
      // If unauthorized, clear token
      if (error.message.includes('Authentication error')) {
        localStorage.removeItem('token');
      }
    });
  }
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

// Chat events
export const joinChatRoom = (chatId) => {
  const s = getSocket();
  if (s) {
    s.emit('join_chat', chatId);
  }
};

export const leaveChatRoom = (chatId) => {
  const s = getSocket();
  if (s) {
    s.emit('leave_chat', chatId);
  }
};

export const sendChatMessage = (message) => {
  const s = getSocket();
  if (s) {
    s.emit('new_message', message);
  }
};

export const typingInChat = (chatId, isTyping) => {
  const s = getSocket();
  if (s) {
    s.emit('typing', { chatId, isTyping });
  }
};

export const markMessagesAsRead = (chatId) => {
  const s = getSocket();
  if (s) {
    s.emit('read_messages', chatId);
  }
};

// Bet events
export const emitBetInteraction = (betId, type, data) => {
  const s = getSocket();
  if (s) {
    s.emit('bet_interaction', {
      betId,
      type, // 'like', 'comment', 'share', 'ride', 'hedge'
      data
    });
  }
};

// Add listeners for socket events
export const onMessageReceived = (callback) => {
  const s = getSocket();
  if (s) {
    s.on('message_received', callback);
  }
  return () => {
    if (s) {
      s.off('message_received', callback);
    }
  };
};

export const onUserTyping = (callback) => {
  const s = getSocket();
  if (s) {
    s.on('user_typing', callback);
  }
  return () => {
    if (s) {
      s.off('user_typing', callback);
    }
  };
};

export const onBetUpdate = (callback) => {
  const s = getSocket();
  if (s) {
    s.on('bet_update', callback);
  }
  return () => {
    if (s) {
      s.off('bet_update', callback);
    }
  };
};

export const onNewNotification = (callback) => {
  const s = getSocket();
  if (s) {
    s.on('new_notification', callback);
  }
  return () => {
    if (s) {
      s.off('new_notification', callback);
    }
  };
};

export const onUserStatusChange = (callback) => {
  const s = getSocket();
  if (s) {
    s.on('user_status_change', callback);
  }
  return () => {
    if (s) {
      s.off('user_status_change', callback);
    }
  };
};


// Notification events
export const subscribeToNotifications = () => {
  const s = getSocket();
  if (s) {
    s.emit('subscribe_notifications');
  }
};

export const markNotificationAsRead = (notificationId) => {
  const s = getSocket();
  if (s) {
    s.emit('read_notification', { notificationId });
  }
};

// Disconnecting socket on logout
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initializeSocket,
  getSocket,
  joinChatRoom,
  leaveChatRoom,
  sendChatMessage,
  typingInChat,
  markMessagesAsRead,
  subscribeToBetUpdates,
  unsubscribeFromBetUpdates,
  subscribeToNotifications,
  markNotificationAsRead,
  disconnectSocket,
};
