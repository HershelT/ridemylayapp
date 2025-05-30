import { create }  from 'zustand';
import { notificationAPI } from '../services/notificationService';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null
};

const useNotificationStore = create((set, get) => ({
  ...initialState,
  
  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const response = await notificationAPI.getNotifications();
      const notifications = response.data || [];
      set({ 
        notifications,
        loading: false,
        // Keep existing unreadCount instead of recalculating
        unreadCount: get().unreadCount 
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      const count = response.data?.count || 0;
      set({ unreadCount: count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
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
      console.error('Error marking notification as read:', error);
      set({ error: error.message });
    }
  },

  addNotification: (notification) => {
    if (!notification || !notification._id) return;
    
    set(state => {
      // Check if notification already exists
      const exists = state.notifications.some(n => n._id === notification._id);
      if (exists) return state;

      // Add new notification and increment unread count
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    });
  }
}));

export default useNotificationStore;