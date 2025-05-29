import { io } from 'socket.io-client';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

// Create and initialize socket instance
const createSocket = () => {
  if (socket) return socket; // Return existing socket if it exists
  
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('No auth token found, socket connection not established');
    return null;
  }

  try {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
    socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      transports: ['websocket'],
      autoConnect: false // We'll connect manually
    });
    
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      reconnectAttempts = 0;
      // Resubscribe to notifications on reconnect
      socket.emit('subscribe_notifications');
      // Dispatch event to notify components of reconnection
      window.dispatchEvent(new CustomEvent('socket_reconnected'));
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, attempt to reconnect
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          setTimeout(() => {
            if (socket) socket.connect();
          }, RECONNECT_DELAY);
        }
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        setTimeout(() => {
          if (socket) socket.connect();
        }, RECONNECT_DELAY);
      }
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
  // Set up global socket event listeners for notifications
    socket.on('notifications_init', (notifications) => {
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('notifications_init', { detail: notifications }));
      }
      // Store the last sync timestamp to handle cross-tab sync
      localStorage.setItem('lastNotificationSync', Date.now().toString());
    });

    // Handle broadcast channel for cross-tab notification sync
    const notificationChannel = new BroadcastChannel('notifications');
    notificationChannel.onmessage = (event) => {
      if (event.data.type === 'notification_received' || event.data.type === 'notification_read') {
        socket.emit('subscribe_notifications'); // Re-fetch notifications
      }
    };

    socket.on('new_notification', (notification) => {
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('new_notification', { detail: notification }));
      }
    });

    // Connect the socket
    socket.connect();
    
    return socket;
  } catch (error) {
    console.error('Error creating socket:', error);
    return null;
  }
};

// Get or create socket instance
const getSocket = () => {
  if (!socket || !socket.connected) {
    socket = createSocket();
  }
  return socket;
};

// Chat events
const joinChatRoom = (chatId) => {
  const s = getSocket();
  if (s) {
    s.emit('join_chat', chatId);
  }
};

const leaveChatRoom = (chatId) => {
  const s = getSocket();
  if (s) {
    s.emit('leave_chat', chatId);
  }
};

const typingInChat = (chatId, isTyping) => {
  const s = getSocket();
  if (s) {
    s.emit('typing', { chatId, isTyping });
  }
};

const markMessagesAsRead = (chatId) => {
  const s = getSocket();
  if (s) {
    s.emit('read_messages', chatId);
  }
};

const sendChatMessage = (message) => {
  const s = getSocket();
  if (s) {
    s.emit('new_message', message);
  }
};

const onMessageReceived = (callback) => {
  const s = getSocket();
  if (s) {
    // Listen only for message_received events
    s.on('message_received', callback);
  }
  return () => {
    if (s) {
      s.off('message_received', callback);
    }
  };
};

// Bet events
const emitBetInteraction = (betId, type, data) => {
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
const onUserTyping = (callback) => {
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

const onBetUpdate = (callback) => {
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

// // Helper function to handle browser notifications
// const handleBrowserNotification = (notification) => {
//   if (!notification || !notification.sender) return;

//   // Check if we should show the notification
//   const isInChat = window.location.pathname.startsWith('/messages') && 
//                   notification.entityType === 'chat' && 
//                   window.location.pathname.includes(notification.entityId);
//   const isActiveTab = document.hasFocus();
  
//   // Don't show notification if we're in the active chat
//   if (isInChat && isActiveTab) return;

//   // Request permission if not granted
//   if (Notification.permission === 'default') {
//     Notification.requestPermission();
//   }

//   // Show browser notification if permission is granted
//   if (Notification.permission === 'granted') {
//     const title = notification.type === 'message' 
//       ? `New message from ${notification.sender.username}`
//       : `New ${notification.type.replace('_', ' ')} from ${notification.sender.username}`;

//     const browserNotification = new Notification(title, {
//       body: notification.content,
//       icon: notification.sender.avatarUrl || '/favicon.ico',
//       tag: `${notification.type}-${notification.entityId}`,
//       requireInteraction: true
//     });

//     browserNotification.onclick = () => {
//       window.focus();
//       switch (notification.entityType) {
//         case 'chat':
//           window.location.href = `/messages/${notification.entityId}`;
//           break;
//         case 'bet':
//           window.location.href = `/bets/${notification.entityId}`;
//           break;
//         case 'user':
//           window.location.href = `/profile/${notification.entityId}`;
//           break;
//         default:
//           window.location.href = '/';
//       }
//     };
//   }
// };

const onNewNotification = (callback) => {
  const s = getSocket();
  let cleanupFunctions = [];

  if (s) {
    // Listen for new notifications
    const handleNewNotification = (notification) => {
      // Trigger the browser notification
      handleBrowserNotification(notification);
      // Call the provided callback
      if (callback && typeof callback === 'function') {
        callback(notification);
      }
    };

    s.on('new_notification', handleNewNotification);
    cleanupFunctions.push(() => s.off('new_notification', handleNewNotification));

    // Listen for notification updates (e.g., marking as read)
    s.on('notification_updated', (notification) => {
      if (callback && typeof callback === 'function') {
        callback(notification, 'update');
      }
    });
    cleanupFunctions.push(() => s.off('notification_updated'));

    // Handle reconnection
    const handleConnect = () => {
      console.log('Socket reconnected, resubscribing to notifications');
      s.emit('subscribe_notifications');
    };
    s.on('connect', handleConnect);
    cleanupFunctions.push(() => s.off('connect', handleConnect));

    // Initial subscription
    if (s.connected) {
      s.emit('subscribe_notifications');
    }

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

const onUserStatusChange = (callback) => {
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

// User stats events
const onUserStatsUpdate = (callback) => {
  const s = getSocket();
  if (!s) return () => {};
  
  s.on('user_stats_update', callback);
  return () => {
    s.off('user_stats_update', callback);
  };
};

// Notification events
const subscribeToNotifications = () => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('subscribe_notifications');
  } else if (s) {
    // If socket exists but not connected, wait for connection then subscribe
    s.once('connect', () => {
      s.emit('subscribe_notifications');
    });
  }
};

const markNotificationAsRead = (notificationId) => {
  const s = getSocket();
  if (s) {
    s.emit('read_notification', { notificationId });
  }
};

// Disconnecting socket on logout
const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};


const subscribeToMessages = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on('message received', callback);
    return () => socket.off('message received', callback);
  }
  return () => {};
};

const subscribeToChatTyping = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on('typing', callback);
    return () => socket.off('typing', callback);
  }
  return () => {};
};

const emitTyping = (chatId) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('typing', chatId);
  }
};

const subscribeToBetUpdates = (betId, callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on(`bet:${betId}:update`, callback);
  }
};

const unsubscribeFromBetUpdates = (betId, callback) => {
  const socket = getSocket();
  if (socket) {
    socket.off(`bet:${betId}:update`, callback);
  }
};

// Helper function to handle browser notifications
const handleBrowserNotification = (notification) => {
  if (!notification || !notification.sender) return;

  // Check if we should show the notification
  const isInChat = window.location.pathname.startsWith('/messages') && 
                  notification.entityType === 'chat' && 
                  window.location.pathname.includes(notification.entityId);
  const isActiveTab = document.hasFocus();
  
  // Don't show notification if we're in the active chat
  if (isInChat && isActiveTab) return;

  // Request permission if not granted
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Show browser notification if permission is granted
  if (Notification.permission === 'granted') {
    const title = notification.type === 'message' 
      ? `New message from ${notification.sender.username}`
      : `New ${notification.type.replace('_', ' ')} from ${notification.sender.username}`;

    const browserNotification = new Notification(title, {
      body: notification.content,
      icon: notification.sender.avatarUrl || '/favicon.ico',
      tag: `${notification.type}-${notification.entityId}`,
      requireInteraction: true
    });

    browserNotification.onclick = () => {
      window.focus();
      switch (notification.entityType) {
        case 'chat':
          window.location.href = `/messages/${notification.entityId}`;
          break;
        case 'bet':
          window.location.href = `/bets/${notification.entityId}`;
          break;
        case 'user':
          window.location.href = `/profile/${notification.entityId}`;
          break;
        default:
          window.location.href = '/';
      }
    };
  }
};

const socketService = {
  getSocket,
  createSocket,
  joinChatRoom,
  leaveChatRoom,
  typingInChat,
  markMessagesAsRead,
  subscribeToBetUpdates,
  unsubscribeFromBetUpdates,
  subscribeToNotifications,
  markNotificationAsRead,
  disconnectSocket,
  onMessageReceived,
  onUserTyping,
  onBetUpdate,
  onNewNotification,
  onUserStatusChange,
  subscribeToMessages,
  subscribeToChatTyping,
  emitTyping,
  emitBetInteraction,
  onUserStatsUpdate,
  sendChatMessage
};

export default socketService;
