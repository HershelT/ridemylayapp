import React, { useEffect, useContext } from 'react';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket';

// Create context
const SocketContext = React.createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuthStore();
  
  // Initialize socket when authenticated
  useEffect(() => {
  if (isAuthenticated && token) {
    console.log('SocketProvider: User authenticated, initializing socket');
    const socket = socketService.createSocket();
    
    // Only initialize once
    if (socket && !socketService.getConnectionStatus() !== 'connected') {
      // Subscribe to notifications by default
      socketService.subscribeToNotifications();
      
      // Add event listener for when socket connects
      const handleConnect = () => {
        console.log('Socket connected, resubscribing to services');
        socketService.subscribeToNotifications();
      };
      
      window.addEventListener('socket_connected', handleConnect);
      
      return () => {
        window.removeEventListener('socket_connected', handleConnect);
      };
    }
  } else {
    console.log('SocketProvider: User not authenticated, resetting socket');
    socketService.disconnectSocket();
  }
}, [isAuthenticated, token]);
  
  // Value provided by context
  const value = {
    getSocket: socketService.getSocket,
    subscribeToNotifications: socketService.subscribeToNotifications,
    unsubscribeFromNotifications: socketService.unsubscribeFromNotifications,
    isSubscribedToNotifications: socketService.isSubscribedToNotifications, // Add this line
    joinChatRoom: socketService.joinChatRoom,
    leaveChatRoom: socketService.leaveChatRoom,
    reconnect: socketService.reconnect,
    getConnectionStatus: socketService.getConnectionStatus,
    onNewNotification: socketService.onNewNotification,
    onMessageReceived: socketService.onMessageReceived,
    onUserTyping: socketService.onUserTyping,
    onBetUpdate: socketService.onBetUpdate,
    subscribeToBetUpdates: socketService.subscribeToBetUpdates,
    markMessagesAsRead: socketService.markMessagesAsRead
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;