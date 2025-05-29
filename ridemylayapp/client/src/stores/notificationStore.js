import create from 'zustand';
import { notificationAPI } from '../services/notificationService';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: null
};

const useNotificationStore = create((set, get) => {
  // Initialize event listeners
  window.addEventListener('notifications_init', (event) => {
    const notifications = event.detail || [];
    set({ notifications, loading: false });
  });

  window.addEventListener('new_notification', (event) => {
    if (event.detail) {
      const store = get();
      if (store && typeof store.addNotification === 'function') {
        store.addNotification(event.detail);
      }
    }
  });

  return {
    ...initialState,
    fetchNotifications: async () => {
    set({ loading: true });
    try {
      const notifications = await notificationAPI.getNotifications();
      set({ notifications: notifications || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false, notifications: [] });
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
    markAllAsRead: async () => {
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

    deleteNotification: async (notificationId) => {
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

    addNotification: (notification) => {
    if (!notification || !notification._id) return;
    
    set(state => {
      const notifications = Array.isArray(state.notifications) ? state.notifications : [];
      
      // Check if notification already exists
      const exists = notifications.some(n => n?._id === notification._id);
      if (exists) return state;  // Don't add duplicate notifications

      return {
        notifications: [notification, ...notifications],
        unreadCount: (state.unreadCount || 0) + 1
      };    });
    }
  };
});

export default useNotificationStore;
