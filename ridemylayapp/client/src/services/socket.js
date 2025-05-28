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
  let cleanupFunctions = [];

  if (s) {
    // Listen for new notifications
    s.on('new_notification', callback);
    cleanupFunctions.push(() => s.off('new_notification', callback));

    // Listen for notification updates (e.g., marking as read)
    s.on('notification_updated', notification => {
      callback(notification, 'update');
    });
    cleanupFunctions.push(() => s.off('notification_updated', callback));

    // Handle reconnection
    s.on('connect', () => {
      s.emit('subscribe_notifications');
    });
    cleanupFunctions.push(() => s.off('connect'));

    // Handle errors
    s.on('notification_error', (error) => {
      console.error('Notification error:', error);
    });
    cleanupFunctions.push(() => s.off('notification_error'));
  }

  return () => {
    if (s) {
      cleanupFunctions.forEach(cleanup => cleanup());
    }
  };
};

export const onUserStatusChange = (callback) => {
  const s = getSocket();
  let cleanupFunctions = [];

  if (s) {
    s.on('user_status_change', callback);
    cleanupFunctions.push(() => s.off('user_status_change', callback));

    // Handle reconnection
    s.on('connect', () => {
      s.emit('subscribe_status_updates');
    });
    cleanupFunctions.push(() => s.off('connect'));
  }

  return () => {
    if (s) {
      cleanupFunctions.forEach(cleanup => cleanup());
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

// Chat event emitters
export const joinChat = (chatId) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('join chat', chatId);
  }
};

export const leaveChat = (chatId) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('leave chat', chatId);
  }
};

export const sendChatMessage = (message) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('new message', message);
  }
};

export const subscribeToMessages = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on('message received', callback);
    return () => socket.off('message received', callback);
  }
  return () => {};
};

export const subscribeToChatTyping = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on('typing', callback);
    return () => socket.off('typing', callback);
  }
  return () => {};
};

export const emitTyping = (chatId) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('typing', chatId);
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
