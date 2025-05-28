import React, { useEffect } from 'react';
import styled from 'styled-components';
import { formatDistanceToNow } from 'date-fns';
import useNotificationStore from '../stores/notificationStore';
import { Link } from 'react-router-dom';
import { BsTrash, BsCheck } from 'react-icons/bs';

const Container = styled.div`
  max-height: 400px;
  width: 350px;
  overflow-y: auto;
  background: ${props => props.theme.background};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MarkAllButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.primary};
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const NotificationItem = styled(Link)`
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.unread ? props.theme.hover : 'transparent'};
  text-decoration: none;
  color: inherit;
  
  &:hover {
    background: ${props => props.theme.hover};
  }
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const Message = styled.div`
  font-size: 14px;
  color: ${props => props.theme.textSecondary};
`;

const Time = styled.div`
  font-size: 12px;
  color: ${props => props.theme.textTertiary};
  margin-top: 4px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme.textSecondary};
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: ${props => props.theme.hover};
    color: ${props => props.theme.text};
  }
`;

const EmptyState = styled.div`
  padding: 32px 16px;
  text-align: center;
  color: ${props => props.theme.textSecondary};
`;

const NotificationList = () => {
  const { notifications = [], loading, fetchNotifications, markAsRead, deleteNotification, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  if (loading) {
    return <Container>
      <Header>
        <h3>Notifications</h3>
      </Header>
      <EmptyState>Loading notifications...</EmptyState>
    </Container>;
  }

  const getNotificationTitle = (notification) => {
    switch (notification.type) {
      case 'message':
        return 'New message';
      case 'bet_interaction':
        return notification.metadata.interactionType === 'like' ? 'Liked your bet' : 'Commented on your bet';
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
    switch (notification.entityType) {
      case 'chat':
        return `/messages/\${notification.entityId}`;
      case 'bet':
        return `/bets/\${notification.entityId}`;
      case 'user':
        return `/profile/\${notification.entityId}`;
      default:
        return '/';
    }
  };

  return (
    <Container>
      <Header>
        <h3>Notifications</h3>
        {notifications.some(n => !n.read) && (
          <MarkAllButton onClick={markAllAsRead}>
            Mark all as read
          </MarkAllButton>
        )}
      </Header>
      
      {notifications.length === 0 ? (
        <EmptyState>No notifications yet</EmptyState>
      ) : (
        notifications.map(notification => (
          <NotificationItem 
            key={notification._id}
            to={getNotificationLink(notification)}
            unread={!notification.read}
            onClick={() => {
              if (!notification.read) {
                markAsRead(notification._id);
              }
            }}
          >
            <Content>
              <Title>{getNotificationTitle(notification)}</Title>
              <Message>{notification.content}</Message>
              <Time>{formatDistanceToNow(new Date(notification.createdAt))} ago</Time>
            </Content>
            <Actions>
              {!notification.read && (
                <IconButton onClick={(e) => {
                  e.preventDefault();
                  markAsRead(notification._id);
                }}>
                  <BsCheck size={18} />
                </IconButton>
              )}
              <IconButton onClick={(e) => {
                e.preventDefault();
                deleteNotification(notification._id);
              }}>
                <BsTrash size={14} />
              </IconButton>
            </Actions>
          </NotificationItem>
        ))
      )}
    </Container>
  );
};

export default NotificationList;
