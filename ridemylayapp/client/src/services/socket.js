import { io } from 'socket.io-client';
import useNotificationStore from '../stores/notificationStore';

// Socket state variables
let socket = null;
let connectionStatus = 'disconnected'; // 'connected', 'disconnected', 'connecting', 'error'
let reconnectAttempts = 0;
let lastConnectionError = null; 
let subscriptions = {
  notifications: false,
  chats: new Set(),
  betUpdates: new Set()
};

// Configuration
const MAX_RECONNECT_ATTEMPTS = 30;
const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 30000;
let pingInterval = null;

// Add heartbeat tracking
let lastHeartbeat = 0;
const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const HEARTBEAT_TIMEOUT = 30000; // 30 seconds


// Listeners registry to avoid duplicates
const listeners = {
  notification: new Set(),
  message: new Set(),
  betUpdate: new Set(),
  userStatus: new Set(),
  typing: new Set()
};
// Add this at the top of the file with other state variables
let connectionRequestPending = false;
let connectionRequestQueue = [];
// Add a notification tracker set
const processedSocketNotifications = new Set();



// Create and initialize socket instance
// Modify createSocket to handle request batching
const createSocket = () => {
  if (socket?.connected) return socket;
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('Socket: No auth token found, connection not established');
    return null;
  }

  // If a connection request is already pending, queue this request
  if (connectionRequestPending) {
    console.log('Socket: Connection already being established, queuing request');
    return new Promise(resolve => {
      connectionRequestQueue.push(resolve);
    });
  }

  connectionRequestPending = true;
  
  try {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
    
    // Cleanup any existing socket
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    
    console.log('Socket: Creating new connection to', socketUrl);
    
    // Create new socket
    socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });
    
    // Setup connection event handlers
    setupSocketEvents();
    
    // Add a handler for successful connection to resolve all queued requests
    socket.on('connect', () => {
      connectionRequestPending = false;
      connectionRequestQueue.forEach(resolve => resolve(socket));
      connectionRequestQueue = [];
    });
    
    return socket;
  } catch (error) {
    console.error('Socket: Error creating socket connection:', error);
    connectionRequestPending = false;
    lastConnectionError = error.message; // Store the error message
    return null;
  }
};

// Setup core socket event listeners
const setupSocketEvents = () => {
  if (!socket) return;
  
  // Connection events
  socket.on('connect', () => {
    console.log('Socket: Connected successfully', socket.id);
    connectionStatus = 'connected';
    reconnectAttempts = 0;
    lastConnectionError = null; // Clear any previous errors

    
    // Resubscribe to everything after reconnection
    resubscribeAll();
    
    // Dispatch reconnection event
    window.dispatchEvent(new Event('socket_connected'));
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket: Disconnected', reason);
    connectionStatus = 'disconnected';
    window.dispatchEvent(new Event('socket_disconnected'));
    
    // If server initiated disconnect, try to reconnect
    if (reason === 'io server disconnect' || reason === 'transport close') {
      setTimeout(() => {
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`Socket: Attempting reconnect ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
          connectionStatus = 'connecting';
          socket.connect();
        }
      }, RECONNECT_DELAY);
    }
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket: Connection error', error);
    connectionStatus = 'error';
    lastConnectionError = error.message; // Store the error message

    
    // Attempt reconnect with exponential backoff
    const delay = RECONNECT_DELAY * Math.min(Math.pow(2, reconnectAttempts), 10);
    
    setTimeout(() => {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Socket: Attempting reconnect ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        connectionStatus = 'connecting';
        socket.connect();
      } else {
      // Max attempts reached, force user to reload
      window.dispatchEvent(new CustomEvent('socket_connection_failed', {
        detail: { error: lastConnectionError }
      }));
    }
  }, delay);
  });
  
  // Set up ping interval to keep connection alive
  clearInterval(pingInterval);
  pingInterval = setInterval(() => {
    if (socket?.connected) {
      socket.emit('ping');
    }
  }, PING_INTERVAL);
  
  // Set up pong response
  socket.on('pong', () => {
    console.log('Socket: Received pong from server');
  });
  
  // Handle notifications
  socket.on('notifications_init', (notifications) => {
    console.log('Socket: Received initial notifications', notifications.length);
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('notifications_init', { detail: notifications }));
    }
    // Store the last sync timestamp to handle cross-tab sync
    localStorage.setItem('lastNotificationSync', Date.now().toString());
  });
  
  // Handle new notifications
  socket.on('new_message', (message) => {
    console.log('Socket: New message received:', message);
    window.dispatchEvent(new CustomEvent('message_received', { 
      detail: message 
    }));
  });

  // In the setupSocketEvents function, update the new_notification handler:
  socket.on('new_notification', (notification) => {
    // Skip if already processed (using _id as unique identifier)
    if (notification._id && processedSocketNotifications.has(notification._id)) {
      console.log('Socket: Duplicate notification skipped', notification._id);
      return;
    }
    
    // Add to processed set
    if (notification._id) {
      processedSocketNotifications.add(notification._id);
      
      // Keep set size manageable
      if (processedSocketNotifications.size > 100) {
        const iterator = processedSocketNotifications.values();
        processedSocketNotifications.delete(iterator.next().value);
      }
    }
    
    console.log('Socket: New notification received', notification);
    window.dispatchEvent(new CustomEvent('new_notification', { 
      detail: notification 
    }));
    
    // Browser notification
    handleBrowserNotification(notification);
  });
  
  socket.on('notification_count_updated', () => {
    console.log('Socket: Notification count updated');
    const notificationStore = useNotificationStore.getState();
    notificationStore.fetchUnreadCount();
    
    window.dispatchEvent(new Event('notification_count_updated'));
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket: General error', error);
  });

  // Set up heartbeat
  const heartbeatInterval = setInterval(() => {
    if (socket?.connected) {
      const now = Date.now();
      // If no heartbeat for too long, force reconnect
      if (lastHeartbeat > 0 && now - lastHeartbeat > HEARTBEAT_TIMEOUT) {
        console.warn(`Socket: No heartbeat for ${(now - lastHeartbeat)/1000}s, reconnecting`);
        reconnect();
        return;
      }
      
      socket.emit('heartbeat');
    }
  }, HEARTBEAT_INTERVAL);
  
  socket.on('heartbeat', () => {
    lastHeartbeat = Date.now();
  });
  
  // Add cleanup
  return () => {
    clearInterval(heartbeatInterval);
  };


}

// Resubscribe to all previous subscriptions after reconnect
const resubscribeAll = () => {
  // Resubscribe to notifications
  if (subscriptions.notifications) {
    subscribeToNotifications();
  }
  
  // Resubscribe to chats
  subscriptions.chats.forEach(chatId => {
    joinChatRoom(chatId);
  });
  
  // Resubscribe to bet updates
  subscriptions.betUpdates.forEach(betId => {
    socket.emit('subscribe_bet', { betId });
  });
  
  // Notify app about reconnection
  window.dispatchEvent(new Event('socket_reconnected'));
};

// Get socket instance
const getSocket = () => {
  // If no socket exists or it's disconnected, create a new one
  if (!socket || (!socket.connected && connectionStatus !== 'connecting')) {
    return createSocket();
  }
  return socket;
};

// Get connection status
const getConnectionStatus = () => connectionStatus;

// Subscribe to notifications
const subscribeToNotifications = () => {
  const s = getSocket();
  if (!s) return false;
  
  if (subscriptions.notifications) {
    console.log('Socket: Already subscribed to notifications');
    return true;
  }
  
  console.log('Socket: Subscribing to notifications');
  
  // Only subscribe if we're connected
  if (s.connected) {
    s.emit('subscribe_notifications');
    subscriptions.notifications = true;
    
    // Success
    return true;
  }
  
  return false;
};

// Unsubscribe from notifications
const unsubscribeFromNotifications = () => {
  const s = getSocket();
  if (!s) return;
  
  console.log('Socket: Unsubscribing from notifications');
  
  if (s.connected) {
    s.emit('unsubscribe_notifications');
  }
  
  subscriptions.notifications = false;
};

// Join chat room
const joinChatRoom = (chatId) => {
  const s = getSocket();
  
  if (!s || !chatId) {
    console.warn(`Socket: Cannot join chat room ${chatId} - socket or chatId missing`);
    return;
  }
  
  if (s instanceof Promise) {
    console.log(`Socket: Connection in progress, joining chat room ${chatId} when ready`);
    
    s.then(socket => {
      if (socket && socket.connected) {
        console.log(`Socket: Joining chat room ${chatId} (delayed)`);
        socket.emit('join_chat', chatId);
        subscriptions.chats.add(chatId);
      }
    }).catch(err => {
      console.error(`Socket: Failed to join chat room ${chatId}:`, err);
    });
    return;
  }
  
  console.log(`Socket: Joining chat room ${chatId}, socket connected: ${s.connected}`);
  
  if (s.connected) {
    s.emit('join_chat', chatId);
    subscriptions.chats.add(chatId);
    console.log(`Socket: Joined chat room ${chatId}, current chat rooms:`, Array.from(subscriptions.chats));
  } else {
    console.warn(`Socket: Cannot join chat ${chatId} - socket not connected`);
    // Try reconnecting
    reconnect();
  }
};

// Leave chat room
const leaveChatRoom = (chatId) => {
  const s = getSocket();
  if (!s || !chatId) return;
  
  console.log(`Socket: Leaving chat room ${chatId}`);
  
  if (s.connected) {
    s.emit('leave_chat', chatId);
    subscriptions.chats.delete(chatId);
  }
};

const markMessagesAsRead = (chatId) => {
  const s = getSocket();
  if (!s || !chatId) return;
  
  console.log(`Socket: Marking messages as read for chat ${chatId}`);
  
  if (s.connected) {
    s.emit('read_messages', chatId);
    
    // Also update through API for persistence
    // try {
    //   messageAPI.markAsRead(chatId)
    //     .then(() => console.log('Messages marked as read via API'))
    //     .catch(err => console.error('Error marking messages as read via API:', err));
    // } catch (e) {
    //   console.error('Error calling markAsRead API:', e);
    // }
  }
};

// Send chat message
const sendChatMessage = (message) => {
  const s = getSocket();
  if (!s) return;
  
  if (s.connected) {
    s.emit('new_message', message);
  }
};

// Mark notification as read
const markNotificationAsRead = (notificationId) => {
  const s = getSocket();
  if (!s) return;
  
  if (s.connected) {
    s.emit('read_notification', { notificationId });
  }
};

// Listen for new messages
const onMessageReceived = (callback) => {
  const s = getSocket();
  
  // If we don't have a socket at all, return a no-op cleanup function
  if (!s) {
    console.warn('Socket: No socket for message listener');
    return () => {};
  }
  
  // If getSocket returned a Promise (connection in progress), handle it
  if (s instanceof Promise) {
    console.log('Socket: Connection in progress, setting up message listener when ready');
    
    // Set up a promise chain to handle the socket when it's ready
    s.then(socket => {
      if (socket && typeof callback === 'function') {
        // Set up the event handlers when the socket is ready
        const handleMessage = (message) => {
          try {
            callback(message);
          } catch (err) {
            console.error('Error in message callback:', err);
          }
        };
        
        socket.on('new_message', handleMessage);
        socket.on('message_received', handleMessage);
        
        listeners.message.add({ event: 'new_message', handler: handleMessage });
        listeners.message.add({ event: 'message_received', handler: handleMessage });
      }
    }).catch(err => {
      console.error('Socket connection failed:', err);
    });
    
    // Return cleanup function
    return () => {
      console.log('Cleanup requested for message listeners (will be executed when socket is available)');
    };
  }
  
  // If callback is not a function, return a no-op
  if (typeof callback !== 'function') {
    console.warn('Socket: No callback provided for message listener');
    return () => {};
  }
  
  // Normal case - we have a socket instance
  const handleMessage = (message) => {
    try {
      callback(message);
    } catch (err) {
      console.error('Error in message callback:', err);
    }
  };
  
  // Listen for both possible event names
  s.on('new_message', handleMessage);
  s.on('message_received', handleMessage);
  
  listeners.message.add({ event: 'new_message', handler: handleMessage });
  listeners.message.add({ event: 'message_received', handler: handleMessage });
  
  // Return cleanup function
  return () => {
    if (s && typeof s.off === 'function') {
      s.off('new_message', handleMessage);
      s.off('message_received', handleMessage);
      listeners.message.delete({ event: 'new_message', handler: handleMessage });
      listeners.message.delete({ event: 'message_received', handler: handleMessage });
    }
  };
};

// Listen for typing in chat
const onUserTyping = (callback) => {
  const s = getSocket();
  
  if (!s) {
    console.warn('Socket: No socket for typing listener');
    return () => {};
  }
  
  if (s instanceof Promise) {
    console.log('Socket: Connection in progress, setting up typing listener when ready');
    
    s.then(socket => {
      if (socket && typeof callback === 'function') {
        socket.on('user_typing', callback);
        listeners.typing.add({ event: 'user_typing', handler: callback });
      }
    }).catch(err => {
      console.error('Socket connection failed:', err);
    });
    
    return () => {
      console.log('Cleanup requested for typing listeners (will be executed when socket is available)');
    };
  }
  
  if (typeof callback !== 'function') {
    console.warn('Socket: No callback provided for typing listener');
    return () => {};
  }
  
  // Add typing listener
  s.on('user_typing', callback);
  listeners.typing.add({ event: 'user_typing', handler: callback });
  
  // Return cleanup function
  return () => {
    if (s && typeof s.off === 'function') {
      s.off('user_typing', callback);
      listeners.typing.delete({ event: 'user_typing', handler: callback });
    }
  };
};

// Emit typing status
const typingInChat = (chatId, isTyping) => {
  const s = getSocket();
  if (!s || !chatId) return;
  
  if (s.connected) {
    s.emit('typing', { chatId, isTyping });
  }
};

// Listen for bet updates
const onBetUpdate = (callback) => {
  const s = getSocket();
  
  if (!s) {
    console.warn('Socket: No socket for bet update listener');
    return () => {};
  }
  
  if (s instanceof Promise) {
    console.log('Socket: Connection in progress, setting up bet update listener when ready');
    
    s.then(socket => {
      if (socket && typeof callback === 'function') {
        socket.on('bet_update', callback);
        listeners.betUpdate.add({ event: 'bet_update', handler: callback });
      }
    }).catch(err => {
      console.error('Socket connection failed:', err);
    });
    
    return () => {
      console.log('Cleanup requested for bet update listeners (will be executed when socket is available)');
    };
  }
  
  if (typeof callback !== 'function') {
    console.warn('Socket: No callback provided for bet update listener');
    return () => {};
  }
  
  // Add bet update listener
  s.on('bet_update', callback);
  listeners.betUpdate.add({ event: 'bet_update', handler: callback });
  
  // Return cleanup function
  return () => {
    if (s && typeof s.off === 'function') {
      s.off('bet_update', callback);
      listeners.betUpdate.delete({ event: 'bet_update', handler: callback });
    }
  };
};

// Subscribe to bet updates
const subscribeToBetUpdates = (betId, callback) => {
  const s = getSocket();
  
  if (!s || !betId) {
    console.warn(`Socket: Cannot subscribe to bet updates for ${betId} - socket or betId missing`);
    return () => {};
  }
  
  if (s instanceof Promise) {
    console.log(`Socket: Connection in progress, setting up bet subscription for ${betId} when ready`);
    
    s.then(socket => {
      if (socket) {
        socket.emit('subscribe_bet', { betId });
        subscriptions.betUpdates.add(betId);
        
        if (typeof callback === 'function') {
          const handler = (data) => {
            if (data.betId === betId) {
              callback(data);
            }
          };
          
          socket.on('bet_update', handler);
          listeners.betUpdate.add({ event: 'bet_update', handler });
        }
      }
    }).catch(err => {
      console.error('Socket connection failed:', err);
    });
    
    return () => {
      console.log(`Cleanup requested for bet subscription ${betId} (will be executed when socket is available)`);
    };
  }
  
  // Subscribe to specific bet updates
  if (s.connected) {
    s.emit('subscribe_bet', { betId });
    subscriptions.betUpdates.add(betId);
  }
  
  if (typeof callback === 'function') {
    const handler = (data) => {
      if (data.betId === betId) {
        callback(data);
      }
    };
    
    s.on('bet_update', handler);
    listeners.betUpdate.add({ event: 'bet_update', handler });
    
    return () => {
      if (s && typeof s.off === 'function') {
        s.off('bet_update', handler);
        listeners.betUpdate.delete({ event: 'bet_update', handler });
      }
    };
  }
  
  return () => {};
};

// Unsubscribe from bet updates
const unsubscribeFromBetUpdates = (betId) => {
  const s = getSocket();
  if (!s || !betId) return;
  
  if (s.connected) {
    s.emit('unsubscribe_bet', { betId });
    subscriptions.betUpdates.delete(betId);
  }
};

// Listen for new notifications
const onNewNotification = (callback) => {
  const s = getSocket();
  
  if (!s) {
    console.warn('Socket: No socket for notification listener');
    return () => {};
  }
  
  if (s instanceof Promise) {
    console.log('Socket: Connection in progress, setting up notification listener when ready');
    
    s.then(socket => {
      if (socket && typeof callback === 'function') {
        const handleNewNotification = (notification) => {
          // Handle browser notification if needed
          handleBrowserNotification(notification);
          // Call the provided callback
          callback(notification);
        };
        
        socket.on('new_notification', handleNewNotification);
        listeners.notification.add({ event: 'new_notification', handler: handleNewNotification });
      }
    }).catch(err => {
      console.error('Socket connection failed:', err);
    });
    
    return () => {
      console.log('Cleanup requested for notification listeners (will be executed when socket is available)');
    };
  }
  
  if (typeof callback !== 'function') {
    console.warn('Socket: No callback provided for notification listener');
    return () => {};
  }
  
  // Add notification listener
  const handleNewNotification = (notification) => {
    // Handle browser notification if needed
    handleBrowserNotification(notification);
    // Call the provided callback
    callback(notification);
  };
  
  s.on('new_notification', handleNewNotification);
  listeners.notification.add({ event: 'new_notification', handler: handleNewNotification });
  
  // Return cleanup function
  return () => {
    if (s && typeof s.off === 'function') {
      s.off('new_notification', handleNewNotification);
      listeners.notification.delete({ event: 'new_notification', handler: handleNewNotification });
    }
  };
};

// Listen for user status changes
// Listen for user status changes
const onUserStatusChange = (callback) => {
  const s = getSocket();
  
  if (!s) {
    console.warn('Socket: No socket for user status listener');
    return () => {};
  }
  
  if (s instanceof Promise) {
    console.log('Socket: Connection in progress, setting up user status listener when ready');
    
    s.then(socket => {
      if (socket && typeof callback === 'function') {
        socket.on('user_status_change', callback);
        listeners.userStatus.add({ event: 'user_status_change', handler: callback });
      }
    }).catch(err => {
      console.error('Socket connection failed:', err);
    });
    
    return () => {
      console.log('Cleanup requested for user status listeners (will be executed when socket is available)');
    };
  }
  
  if (typeof callback !== 'function') {
    console.warn('Socket: No callback provided for user status listener');
    return () => {};
  }
  
  // Add user status listener
  s.on('user_status_change', callback);
  listeners.userStatus.add({ event: 'user_status_change', handler: callback });
  
  // Return cleanup function
  return () => {
    if (s && typeof s.off === 'function') {
      s.off('user_status_change', callback);
      listeners.userStatus.delete({ event: 'user_status_change', handler: callback });
    }
  };
};

// Listen for user stats updates
const onUserStatsUpdate = (callback) => {
  const s = getSocket();
  
  if (!s) {
    console.warn('Socket: No socket for user stats listener');
    return () => {};
  }
  
  if (s instanceof Promise) {
    console.log('Socket: Connection in progress, setting up user stats listener when ready');
    
    s.then(socket => {
      if (socket && typeof callback === 'function') {
        socket.on('user_stats_update', callback);
        listeners.userStatus.add({ event: 'user_stats_update', handler: callback });
      }
    }).catch(err => {
      console.error('Socket connection failed:', err);
    });
    
    return () => {
      console.log('Cleanup requested for user stats listeners (will be executed when socket is available)');
    };
  }
  
  if (typeof callback !== 'function') {
    console.warn('Socket: No callback provided for user stats listener');
    return () => {};
  }
  
  // Add user stats listener
  s.on('user_stats_update', callback);
  listeners.userStatus.add({ event: 'user_stats_update', handler: callback });
  
  // Return cleanup function
  return () => {
    if (s && typeof s.off === 'function') {
      s.off('user_stats_update', callback);
      listeners.userStatus.delete({ event: 'user_stats_update', handler: callback });
    }
  };
};

// Emit bet interaction
const emitBetInteraction = (betId, type, data) => {
  const s = getSocket();
  if (!s || !betId) return;
  
  if (s.connected) {
    s.emit('bet_interaction', {
      betId,
      type, // 'like', 'comment', 'share', 'ride', 'hedge'
      data
    });
  }
};

// Add this function to the socket service, between other notification-related functions
const isSubscribedToNotifications = () => {
  return subscriptions.notifications;
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

// Add socket disconnect handler to cleanup properly
const disconnectSocket = () => {
  if (socket) {
    // First clear all intervals
    clearInterval(pingInterval);
    
    // Remove all listeners with proper tracking
    if (listeners) {
      listeners.notification.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
      listeners.message.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
      listeners.betUpdate.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
      listeners.userStatus.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
      listeners.typing.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
    }
    
    // Clear listener sets
    listeners.notification.clear();
    listeners.message.clear();
    listeners.betUpdate.clear();
    listeners.userStatus.clear();
    listeners.typing.clear();
    
    // Then disconnect
    socket.disconnect();
    socket = null;
    connectionStatus = 'disconnected';
    reconnectAttempts = 0;
    
    // Reset subscriptions
    subscriptions = {
      notifications: false,
      chats: new Set(),
      betUpdates: new Set()
    };
    
    // Clear processed notifications
    processedSocketNotifications.clear();
  }
};

// Force reconnection
const reconnect = () => {
  disconnectSocket();
  createSocket();
};

const getReconnectAttempts = () => reconnectAttempts;
const getLastError = () => lastConnectionError; // You'll need to track this
// in


// Export socket service
const socketService = {
  createSocket,
  getSocket,
  getConnectionStatus,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  isSubscribedToNotifications, // helps with checking subscription status
  getReconnectAttempts,
  getLastError,
  joinChatRoom,
  leaveChatRoom,
  typingInChat,
  markMessagesAsRead,
  sendChatMessage,
  markNotificationAsRead,
  onMessageReceived,
  onUserTyping,
  onBetUpdate,
  subscribeToBetUpdates,
  unsubscribeFromBetUpdates,
  onNewNotification,
  onUserStatusChange,
  onUserStatsUpdate,
  emitBetInteraction,
  disconnectSocket,
  reconnect
};

export default socketService;