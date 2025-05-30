import { create } from 'zustand';
import { notificationAPI } from '../services/notificationService';
import socketService from '../services/socket';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: null
};

const useNotificationStore = create((set, get) => ({
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

      // Notify about count update
      window.dispatchEvent(new CustomEvent('unread_count_updated', {
        detail: { count: sortedNotifications.length }
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ error: error.message, loading: false, notifications: [] });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      const newCount = response.data.count;
      
      set(state => {
        if (state.unreadCount !== newCount) {
          // Only dispatch event if count changed
          window.dispatchEvent(new CustomEvent('unread_count_updated', {
            detail: { count: newCount }
          }));
          return { unreadCount: newCount };
        }
        return state;
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
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

      const newState = {
        notifications: updatedNotifications,
        unreadCount: state.unreadCount + 1
      };

      // Emit events for real-time updates
      window.dispatchEvent(new CustomEvent('new_notification', { 
        detail: notification 
      }));
      
      window.dispatchEvent(new CustomEvent('unread_count_updated', { 
        detail: { count: newState.unreadCount } 
      }));

      return newState;
    });
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      set(state => {
        const updatedNotifications = state.notifications.filter(
          n => n._id !== notificationId
        );
        const newCount = Math.max(0, state.unreadCount - 1);

        // Emit event for count update
        window.dispatchEvent(new CustomEvent('unread_count_updated', {
          detail: { count: newCount }
        }));

        return {
          notifications: updatedNotifications,
          unreadCount: newCount
        };
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      set({ error: error.message });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationAPI.markAllAsRead();
      set({ notifications: [], unreadCount: 0 });
      
      // Emit event for count update
      window.dispatchEvent(new CustomEvent('unread_count_updated', {
        detail: { count: 0 }
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      set({ error: error.message });
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      set(state => {
        const notification = state.notifications.find(n => n._id === notificationId);
        const newCount = Math.max(0, state.unreadCount - (notification?.read ? 0 : 1));
        
        // Emit event for count update if needed
        if (notification && !notification.read) {
          window.dispatchEvent(new CustomEvent('unread_count_updated', {
            detail: { count: newCount }
          }));
        }

        return {
          notifications: state.notifications.filter(n => n._id !== notificationId),
          unreadCount: newCount
        };
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      set({ error: error.message });
    }
  }
}));

export default useNotificationStore;