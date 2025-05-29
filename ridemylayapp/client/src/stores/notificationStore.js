import create from 'zustand';
import { notificationAPI } from '../services/notificationService';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: null,

  init() {
    window.addEventListener('notifications_init', (event) => {
      const notifications = event.detail || [];
      set({ notifications, loading: false });
    });

    window.addEventListener('new_notification', (event) => {
      const notification = event.detail;
      if (!notification) return;
      
      set(state => ({
        notifications: Array.isArray(state.notifications) ? 
          [notification, ...state.notifications] : 
          [notification],
        unreadCount: state.unreadCount + 1
      }));
      
      if (Notification.permission === 'granted') {
        const title = notification.type === 'message' 
          ? `New message from ${notification.sender.username}`
          : `New ${notification.type.replace('_', ' ')} from ${notification.sender.username}`;

        new Notification(title, {
          body: notification.content,
          icon: '/favicon.ico'
        });
      }
    });
  },

  async fetchNotifications() {
    set({ loading: true });
    try {
      const notifications = await notificationAPI.getNotifications();
      set({ notifications: notifications || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false, notifications: [] });
    }
  },

  async fetchUnreadCount() {
    try {
      const { count } = await notificationAPI.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      set({ error: error.message });
    }
  },

  async markAsRead(notificationId) {
    try {
      await notificationAPI.markAsRead(notificationId);
      set(state => ({
        notifications: state.notifications.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  async markAllAsRead() {
    try {
      await notificationAPI.markAllAsRead();
      set(state => ({
        notifications: (state.notifications || []).map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  async deleteNotification(notificationId) {
    try {
      await notificationAPI.deleteNotification(notificationId);
      set(state => {
        const notification = state.notifications.find(n => n._id === notificationId);
        return {
          notifications: state.notifications.filter(n => n._id !== notificationId),
          unreadCount: Math.max(0, state.unreadCount - (notification?.read ? 0 : 1))
        };
      });
    } catch (error) {
      set({ error: error.message });
    }
  },

  addNotification(notification) {
    if (!notification) return;
    set(state => ({
      notifications: Array.isArray(state.notifications) ? 
        [notification, ...state.notifications] : 
        [notification],
      unreadCount: state.unreadCount + 1
    }));
  }
}));

export default useNotificationStore;
