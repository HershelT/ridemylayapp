import React, { useEffect, useCallback } from 'react';
import { BsBell } from 'react-icons/bs';
import useNotificationStore from '../../stores/notificationStore';
import socketService from '../../services/socket';

const NotificationBadge = () => {
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  const setupNotifications = useCallback(() => {
    console.log('Setting up notifications in NotificationBadge');
    const socket = socketService.getSocket();
    if (socket && !socketService.isSubscribedToNotifications()) {
      socketService.subscribeToNotifications();
    }
  }, []);

  useEffect(() => {
    console.log('NotificationBadge mounted, initializing...');
    // Initial fetch and setup
    fetchUnreadCount();
    setupNotifications();

    // Event handlers
    const handleNewNotification = () => {
      console.log('New notification received, updating count');
      fetchUnreadCount();
    };

    const handleCountUpdate = (event) => {
      console.log('Notification count updated:', event.detail?.count);
    };

    const handleReconnect = () => {
      console.log('Socket reconnected, refreshing notification state');
      setupNotifications();
      fetchUnreadCount();
    };

    // Set up event listeners
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('new_notification', handleNewNotification);
      socket.on('notification_count_updated', fetchUnreadCount);
    }
    
    window.addEventListener('socket_reconnected', handleReconnect);
    window.addEventListener('new_notification', handleNewNotification);
    window.addEventListener('unread_count_updated', handleCountUpdate);

    // Periodic refresh as fallback
    const refreshInterval = setInterval(fetchUnreadCount, 30000);

    // Cleanup
    return () => {
      console.log('NotificationBadge unmounting, cleaning up...');
      clearInterval(refreshInterval);
      if (socket) {
        socket.off('new_notification', handleNewNotification);
        socket.off('notification_count_updated', fetchUnreadCount);
      }
      window.removeEventListener('socket_reconnected', handleReconnect);
      window.removeEventListener('new_notification', handleNewNotification);
      window.removeEventListener('unread_count_updated', handleCountUpdate);
    };
  }, [fetchUnreadCount, setupNotifications]);

  return (
    <div className="relative">
      <BsBell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBadge;