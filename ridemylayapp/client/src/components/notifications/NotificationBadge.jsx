import React, { useEffect } from 'react';
import { BsBell } from 'react-icons/bs';
import useNotificationStore from '../../stores/notificationStore';
import socketService from '../../services/socket';

const NotificationBadge = () => {
  const { unreadCount, fetchUnreadCount, init } = useNotificationStore();

  useEffect(() => {
    // Initialize notification listener
    init();
    // Subscribe to notifications via socket
    socketService.subscribeToNotifications();
    // Fetch initial unread count
    fetchUnreadCount();

    // Request notification permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [init, fetchUnreadCount]);

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
