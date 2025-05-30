import { create } from 'zustand';
import { notificationAPI } from '../services/notificationService';
import socketService from '../services/socket';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: null
};

let isProcessingNotification = false;

const processedNotifications = new Set();

// Rate limiter for notifications to prevent flooding
const rateLimiter = (() => {
  const recentNotifications = new Map(); // entityId -> timestamp
  const THROTTLE_PERIOD = 2000; // Reduce to 2 seconds between similar notifications
  
  return {
    shouldProcess: (notification) => {
      if (!notification || !notification.entityId) return true;
      
      const now = Date.now();
      const lastTime = recentNotifications.get(notification.entityId);
      
      if (lastTime && now - lastTime < THROTTLE_PERIOD) {
        console.log(`Rate limiting notification for entity ${notification.entityId}`);
        return false;
      }
      
      // Update the timestamp
      recentNotifications.set(notification.entityId, now);
      
      // Clean up old entries
      if (recentNotifications.size > 100) {
        for (const [key, timestamp] of recentNotifications.entries()) {
          if (now - timestamp > THROTTLE_PERIOD * 2) {
            recentNotifications.delete(key);
          }
        }
      }
      
      return true;
    }
  };
})();

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

  // Now update the addNotification function:
  addNotification: (notification) => {
    // Early return if notification is invalid
    if (!notification || !notification._id) {
      console.warn('Invalid notification data:', notification);
      return;
    }
    
    // Check if we've already processed this notification
    if (processedNotifications.has(notification._id)) {
      console.log('Notification already processed, skipping:', notification._id);
      return;
    }
    
    // For messages only, apply rate limiting for the same sender/chat
    if (notification.type === 'message') {
      if (!rateLimiter.shouldProcess(notification)) {
        return;
      }
    }
    
    // Add to processed set
    processedNotifications.add(notification._id);
    
    // Prevent recursive handling
    if (window._processingNotification) {
      console.warn('Preventing recursive notification processing');
      return;
    }
    
    window._processingNotification = true;
    
    try {
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

        // DON'T dispatch new_notification event - this is causing the recursion
        // Just dispatch count update
        window.dispatchEvent(new CustomEvent('unread_count_updated', { 
          detail: { count: newState.unreadCount } 
        }));

        return newState;
      });
    } finally {
      // Always clear the processing flag
      window._processingNotification = false;
      
      // Limit the size of processedNotifications set (memory management)
      if (processedNotifications.size > 1000) {
        const iterator = processedNotifications.values();
        for (let i = 0; i < 200; i++) {
          processedNotifications.delete(iterator.next().value);
        }
      }
    }
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