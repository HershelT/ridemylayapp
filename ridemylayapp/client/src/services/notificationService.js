import api from './api';
import socketService from './socket';

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`)
};

export const subscribeToNotifications = (callback) => {
  if (!callback || typeof callback !== 'function') {
    console.warn('Invalid callback provided to subscribeToNotifications');
    return () => {};
  }

  const handleNewNotification = (notification) => {
    // Validate notification object
    if (notification && typeof notification === 'object' && notification._id) {
      try {
        callback(notification);
      } catch (err) {
        console.error('Error in notification callback:', err);
      }
    } else {
      console.warn('Received invalid notification:', notification);
    }
  };

  return socketService.onNewNotification(handleNewNotification);
};

