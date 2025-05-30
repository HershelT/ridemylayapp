import React, { useEffect, useCallback } from 'react';
import { BsBell } from 'react-icons/bs';
import useNotificationStore from '../../stores/notificationStore';
import socketService from '../../services/socket';

const NotificationBadge = () => {
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();
    
    // Subscribe to notifications if not already subscribed
    const setupNotifications = () => {
      if (!socketService.isSubscribedToNotifications()) {
        socketService.subscribeToNotifications();
      }
    };

    // Handle new notifications
    const handleNewNotification = () => {
      fetchUnreadCount();
    };

    setupNotifications();
    window.addEventListener('new_notification', handleNewNotification);

    // Refresh count periodically
    const refreshInterval = setInterval(fetchUnreadCount, 30000);

    // Reconnection handler
    const handleReconnect = () => {
      setupNotifications();
      fetchUnreadCount();
    };

    window.addEventListener('socket_reconnected', handleReconnect);


    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchUnreadCount]);

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
