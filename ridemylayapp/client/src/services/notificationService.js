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
  // Show browser notification if permission is granted
  if (Notification.permission === 'granted') {
    const title = notification.type === 'message' 
      ? `New message from ${notification.sender.username}`
      : `New ${notification.type.replace('_', ' ')} from ${notification.sender.username}`;

    new Notification(title, {
      body: notification.content,
      icon: '/favicon.ico' // Add your app icon path
    });
  }
};
