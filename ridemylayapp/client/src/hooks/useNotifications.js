import { useEffect } from 'react';
import socketService from '../services/socket';
import useNotificationStore from '../stores/notificationStore';

export const useNotifications = () => {
  const { addNotification, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    let cleanup = null;

    const setupNotifications = async () => {
      // Initial setup
      await fetchNotifications();
      
      // Check if we're already subscribed to notifications
      // Use optional chaining to prevent errors if the function doesn't exist
      const isAlreadySubscribed = socketService.isSubscribedToNotifications?.() || false;
      
      if (!isAlreadySubscribed) {
        socketService.subscribeToNotifications();
      }

      // Handle new notifications
      const handleNewNotification = (event) => {
        if (event.detail) {
          console.log('Adding new notification:', event.detail);
          addNotification(event.detail);
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