import React, { useEffect, useCallback } from 'react';
import { BsBell } from 'react-icons/bs';
import useNotificationStore from '../../stores/notificationStore';
import socketService from '../../services/socket';

const NotificationBadge = () => {
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  
  // Memoize fetchUnreadCount to prevent unnecessary rerenders
  const memoizedFetchUnreadCount = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Setup notifications and event listeners
  useEffect(() => {
    console.log('NotificationBadge: Setting up notification system');
    
    // Initial fetch
    memoizedFetchUnreadCount();
    
    // Ensure we're subscribed to notifications
    const socket = socketService.getSocket();
    if (socket && socket.connected) {
      socketService.subscribeToNotifications();
    }

      
    // Event handlers
    const handleNewNotification = (event) => {
      console.log('NotificationBadge: New notification event received', event.detail);
      memoizedFetchUnreadCount();
    };
    
    const handleCountUpdate = (event) => {
      console.log('NotificationBadge: Count update event received');
      memoizedFetchUnreadCount();
    };
    
    const handleSocketConnected = () => {
      console.log('NotificationBadge: Socket connected, subscribing to notifications');
      socketService.subscribeToNotifications();
      memoizedFetchUnreadCount();
    };
    
    const handleSocketReconnected = () => {
      console.log('NotificationBadge: Socket reconnected, refreshing data');
      socketService.subscribeToNotifications();
      memoizedFetchUnreadCount();
    };
    
    const handleConnectionFailed = () => {
      console.error('NotificationBadge: Socket connection failed after max attempts');
      // Show user a connection error message or retry button
    };

    // Clear any existing listeners with the same names (prevent duplicates)
    window.removeEventListener('new_notification', handleNewNotification);
    window.removeEventListener('notification_count_updated', handleCountUpdate);
    window.removeEventListener('socket_connected', handleSocketConnected);
    window.removeEventListener('socket_reconnected', handleSocketReconnected);
    window.removeEventListener('socket_connection_failed', handleConnectionFailed);
    
    // Set up event listeners
    window.addEventListener('new_notification', handleNewNotification);
    window.addEventListener('notification_count_updated', handleCountUpdate);
    window.addEventListener('socket_connected', handleSocketConnected);
    window.addEventListener('socket_reconnected', handleSocketReconnected);
    window.addEventListener('socket_connection_failed', handleConnectionFailed);
    
    // Set up periodic refresh as backup
    const refreshInterval = setInterval(memoizedFetchUnreadCount, 30000);
    
    // Clean up function
    return () => {
      console.log('NotificationBadge: Cleaning up event listeners');
      window.removeEventListener('new_notification', handleNewNotification);
      window.removeEventListener('notification_count_updated', handleCountUpdate);
      window.removeEventListener('socket_connected', handleSocketConnected);
      window.removeEventListener('socket_reconnected', handleSocketReconnected);
      window.removeEventListener('socket_connection_failed', handleConnectionFailed);
      clearInterval(refreshInterval);
    };
  }, [memoizedFetchUnreadCount]);

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