import React, { useEffect } from 'react';
import { BsBell } from 'react-icons/bs';
import useNotificationStore from '../stores/notificationStore';
import { subscribeToNotifications } from '../services/notificationService';
import styled from 'styled-components';

const BadgeContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const Badge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #ff4444;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  min-width: 18px;
  text-align: center;
`;

const Icon = styled(BsBell)`
  font-size: 24px;
  color: ${props => props.theme.text};
`;

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
    <BadgeContainer>
      <Icon />
      {unreadCount > 0 && (
        <Badge>{unreadCount > 99 ? '99+' : unreadCount}</Badge>
      )}
    </BadgeContainer>
  );
};

export default NotificationBadge;
