import { create } from 'zustand';
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
    const unreadNotifications = notifications.filter(n => !n.read);
    set({ 
      notifications: unreadNotifications,
      unreadCount: unreadNotifications.length,
      loading: false 
    });
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
        const response = await notificationAPI.getNotifications();
        const notifications = response.data || [];
        
        // Only keep unread notifications
        const unreadNotifications = notifications.filter(n => !n.read);
        
        // Sort by date
        const sortedNotifications = unreadNotifications.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        set({ 
          notifications: sortedNotifications,
          loading: false,
          unreadCount: sortedNotifications.length
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
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
        set(state => {
          const updatedNotifications = state.notifications.filter(
            n => n._id !== notificationId
          );
          return {
            notifications: updatedNotifications,
            unreadCount: Math.max(0, state.unreadCount - 1)
          };
        });
      } catch (error) {
        set({ error: error.message });
      }
    },
    markAllAsRead: async () => {
      try {
        await notificationAPI.markAllAsRead();
        set({ notifications: [], unreadCount: 0 });
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
        const currentNotifications = Array.isArray(state.notifications) 
          ? state.notifications 
          : [];
        
        // Check if notification already exists
        const exists = currentNotifications.some(n => n?._id === notification._id);
        if (exists) return state;

        // Only add if it's unread
        if (notification.read) return state;

        // Add new notification and sort by date
        const updatedNotifications = [notification, ...currentNotifications]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return {
          notifications: updatedNotifications,
          unreadCount: state.unreadCount + 1
        };
      });
    }
  };
});

export default useNotificationStore;
