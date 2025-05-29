import React, { useEffect } from 'react';
import { BsBell } from 'react-icons/bs';
import useNotificationStore from '../../stores/notificationStore';
import { subscribeToNotifications } from '../../services/notificationService';

const NotificationBadge = () => {
  const { unreadCount, fetchUnreadCount, addNotification } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();

    // Subscribe to new notifications
    const unsubscribe = subscribeToNotifications((notification) => {
      addNotification(notification);
    });

    // Request notification permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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
