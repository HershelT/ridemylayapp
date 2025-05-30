import { useEffect } from 'react';
import socketService from '../services/socket';
import useNotificationStore from '../stores/notificationStore';

export const useNotifications = () => {
  const { addNotification, fetchNotifications } = useNotificationStore();

  useEffect(() => {
  let cleanup = null;
  const processedNotifications = new Set(); // Track processed notifications

  const setupNotifications = async () => {
    // Initial setup
    await fetchNotifications();
    
    // Check if we're already subscribed to notifications
    const isAlreadySubscribed = socketService.isSubscribedToNotifications?.() || false;
    
    if (!isAlreadySubscribed) {
      socketService.subscribeToNotifications();
    }

    // Handle new notifications
    const handleNewNotification = (event) => {
      if (event.detail) {
        const notification = event.detail;
        
        // Check if we've already processed this notification
        if (notification._id && processedNotifications.has(notification._id)) {
          console.log('Notification already processed, skipping:', notification._id);
          return;
        }
        
        // Add to processed set
        if (notification._id) {
          processedNotifications.add(notification._id);
          
          // Clear old notifications from set (memory management)
          if (processedNotifications.size > 100) {
            const iterator = processedNotifications.values();
            processedNotifications.delete(iterator.next().value);
          }
        }
        
        console.log('Adding new notification:', notification);
        addNotification(notification);
      }
    };

      // Handle reconnection
      const handleReconnect = async () => {
        console.log('Socket reconnected, refreshing notifications');
        socketService.subscribeToNotifications();
        await fetchNotifications();
      };

      window.addEventListener('new_notification', handleNewNotification);
      window.addEventListener('socket_reconnected', handleReconnect);

      cleanup = () => {
        window.removeEventListener('new_notification', handleNewNotification);
        window.removeEventListener('socket_reconnected', handleReconnect);
      };
    };

    setupNotifications();
    return () => cleanup && cleanup();
  }, [addNotification, fetchNotifications]);
};

export default useNotifications;