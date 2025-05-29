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
  // First check if we should show the notification (not if we're in the chat already)
  if (notification.type === 'message' && 
      document.hasFocus() && 
      window.location.pathname.includes(`/chat/${notification.entityId}`)) {
    return; // Don't show notification if we're already in the chat
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

    const notification = new Notification(title, {
      body: notification.content,
      icon: notification.sender.profilePicture,
      tag: `${notification.type}-${notification.entityId}`, // Prevent duplicate notifications
      icon: '/favicon.ico' // Add your app icon path
    });
  }
};
