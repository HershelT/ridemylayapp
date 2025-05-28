import create from 'zustand';
import { notificationAPI } from '../services/notificationService';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const notifications = await notificationAPI.getNotifications();
      set({ notifications, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { count } = await notificationAPI.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      set({ error: error.message });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      const notifications = get().notifications.map(n =>
        n._id === notificationId ? { ...n, read: true } : n
      );
      set(state => ({ 
        notifications,
        unreadCount: state.unreadCount - 1
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationAPI.markAllAsRead();
      const notifications = get().notifications.map(n => ({ ...n, read: true }));
      set({ notifications, unreadCount: 0 });
    } catch (error) {
      set({ error: error.message });
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      const notifications = get().notifications.filter(n => n._id !== notificationId);
      set(state => ({
        notifications,
        unreadCount: state.unreadCount - (notifications.find(n => n._id === notificationId)?.read ? 0 : 1)
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  }
}));

export default useNotificationStore;
