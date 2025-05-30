import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import socketService from '../services/socket';
import useNotificationStore from '../stores/notificationStore';

export const useNotifications = () => {
  const location = useLocation();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const cleanup = socketService.onNewNotification((notification) => {
        if (typeof addNotification === 'function') {
            console.log('Adding notification to store:', notification);
            addNotification(notification);
        } else {
            console.warn('addNotification is not available in the notification store');
        }
    });
    const socket = socketService.getSocket();
    if (socket && socket.connected) {
        console.log('Subscribing to notifications');
        socket.emit('subscribe_notifications');
    }
    const handleReconnect = () => {
        if (socket && socket.connected) {
            console.log('Socket reconnected, resubscribing to notifications');
            socket.emit('subscribe_notifications');
        }
    };
    window.addEventListener('socket_reconnected', handleReconnect);
    return () => {
        if (cleanup) cleanup();
        window.removeEventListener('socket_reconnected', handleReconnect);
    };
  }, [addNotification]);

  return {
    currentPath: location.pathname,
  };
};
