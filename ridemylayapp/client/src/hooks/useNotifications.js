import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import socketService from '../services/socket';
import useNotificationStore from '../stores/notificationStore';

export const useNotifications = () => {
  const location = useLocation();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // Request notification permissions when the hook is first used
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }    // Subscribe to notifications
    const cleanup = socketService.onNewNotification((notification) => {
      // The socket service now handles browser notifications
      // Add to store only if addNotification is available
      if (typeof addNotification === 'function') {
        addNotification(notification);
      } else {
        console.warn('addNotification is not available in the notification store');
      }
    });

    // Initial subscription
    const socket = socketService.getSocket();
    if (socket && socket.connected) {
      socket.emit('subscribe_notifications');
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [addNotification]);

  return {
    currentPath: location.pathname,
  };
};
