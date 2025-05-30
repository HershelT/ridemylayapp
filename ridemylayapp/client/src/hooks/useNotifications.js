import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import socketService from '../services/socket';
import useNotificationStore from '../stores/notificationStore';

export const useNotifications = () => {
  const location = useLocation();
  const { addNotification, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    let cleanupFunctions = [];
    
    const setupNotifications = async () => {
      const socket = socketService.getSocket();
      
      // Initial subscription and fetch
      if (!socketService.isSubscribedToNotifications()) {
        socketService.subscribeToNotifications();
        await fetchNotifications();
      }

      // Handle new notifications
      const handleNewNotification = (event) => {
        if (event.detail) {
          console.log('Adding new notification to store:', event.detail);
          addNotification(event.detail);
        }
      };

      // Listen for new notifications
      window.addEventListener('new_notification', handleNewNotification);
      cleanupFunctions.push(() => {
        window.removeEventListener('new_notification', handleNewNotification);
      });

      // Handle reconnection
      const handleReconnect = async () => {
        console.log('Socket reconnected, refreshing notifications');
        socketService.subscribeToNotifications();
        await fetchNotifications();
      };

      window.addEventListener('socket_reconnected', handleReconnect);
      cleanupFunctions.push(() => {
        window.removeEventListener('socket_reconnected', handleReconnect);
      });
    };

    setupNotifications();

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [addNotification, fetchNotifications]);

  return { currentPath: location.pathname };
};