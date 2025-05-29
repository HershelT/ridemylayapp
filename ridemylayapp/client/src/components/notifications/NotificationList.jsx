import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import useNotificationStore from '../../stores/notificationStore';
import { BsTrash, BsCheck } from 'react-icons/bs';

const NotificationList = () => {
  const { notifications, loading, fetchNotifications, markAsRead, deleteNotification, markAllAsRead } = useNotificationStore();
  
  // Ensure notifications is an array and each item has a unique _id
  const notificationList = Array.isArray(notifications) ? notifications.filter(n => n && n._id) : [];

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationTitle = (notification) => {
    if (!notification?.type) return 'New notification';
    
    switch (notification.type) {
      case 'message':
        return 'New message';
      case 'bet_interaction':
        return notification.metadata?.interactionType === 'like' ? 'Liked your bet' : 'Commented on your bet';
      case 'follow':
        return 'Started following you';
      case 'bet_outcome':
        return 'Bet outcome updated';
      case 'mention':
        return 'Mentioned you';
      default:
        return 'New notification';
    }
  };

  const getNotificationLink = (notification) => {
    if (!notification?.entityType) return '/';
    
    switch (notification.entityType) {
      case 'chat':
        return `/messages/${notification.entityId}`;
      case 'bet':
        return `/bets/${notification.entityId}`;
      case 'user':
        return `/profile/${notification.entityId}`;
      default:
        return '/';
    }
  };

  const handleMarkAsRead = (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    if (notificationId) {
      markAsRead(notificationId);
    }
  };

  const handleDelete = (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    if (notificationId) {
      deleteNotification(notificationId);
    }
  };

  return (
    <div className="fixed right-0 mt-2 w-full sm:w-96 max-w-[95vw] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
        {notificationList.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : notificationList.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notificationList.map(notification => notification && (
              <Link
                key={notification._id}
                to={getNotificationLink(notification)}
                className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification._id);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getNotificationTitle(notification)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {notification.content}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt))} ago
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, notification._id)}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                        title="Mark as read"
                      >
                        <BsCheck className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, notification._id)}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                      title="Delete notification"
                    >
                      <BsTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
