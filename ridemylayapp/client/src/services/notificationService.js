import api from './api';
import socketService from './socket';

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`)
};

export const subscribeToNotifications = (callback) => {    return socketService.onNewNotification((notification) => {
    callback(notification);
  });
};

export const handleNewNotification = (notification) => {
  // Ensure we have all required data
  if (!notification || !notification.sender) {
    console.warn('Invalid notification received:', notification);
    return;
  }

  // First check if we should show the notification
  const isInChat = window.location.pathname.includes(`/messages`);
  const isActiveTab = document.hasFocus();
  const shouldNotify = !(isInChat && isActiveTab);

  if (!shouldNotify) {
    return; // Don't show notification if we're in the active chat
  }

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
      icon: notification.sender.avatarUrl,
      tag: `${notification.type}-${notification.entityId}`, // Prevent duplicate notifications
      data: { 
        type: notification.type,
        entityId: notification.entityId,
        senderId: notification.sender._id
      },      requireInteraction: true, // Keep notification until user interacts with it
      icon: notification.sender.avatarUrl || '/favicon.ico' // Use sender's avatar or fallback to app icon
    });

    // Add click handler to open the relevant chat/content
    browserNotification.onclick = () => {
      window.focus();
      if (notification.type === 'message') {
        window.location.href = `/messages?chat=${notification.entityId}`;
      }
    };
  }
};
