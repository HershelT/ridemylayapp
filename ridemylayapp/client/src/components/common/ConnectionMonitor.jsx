import React, { useState, useEffect } from 'react';
import socketService from '../../services/socket';

const MAX_RECONNECT_ATTEMPTS = 30

const ConnectionMonitor = () => {
  const [connectionStatus, setConnectionStatus] = useState(socketService.getConnectionStatus());
  const [showBanner, setShowBanner] = useState(connectionStatus !== 'connected');
  const [connectionInfo, setConnectionInfo] = useState({
    attempts: 0,
    lastError: null,
    socketId: null
  });

  // Add this to your effect
  useEffect(() => {
    // Update connection info
    const updateInterval = setInterval(() => {
      const socket = socketService.getSocket();
      setConnectionInfo({
        attempts: socketService.getReconnectAttempts?.() || 0,
        lastError: socketService.getLastError?.() || null,
        socketId: socket?.id || null
      });
    }, 2000);
    
    return () => clearInterval(updateInterval);
  }, []);
  
  useEffect(() => {
    // Check initial connection status
    setConnectionStatus(socketService.getConnectionStatus());
    setShowBanner(socketService.getConnectionStatus() !== 'connected');
    
    // Event handlers
    const handleConnected = () => {
      console.log('ConnectionMonitor: Socket connected');
      setConnectionStatus('connected');
      setShowBanner(false);
    };
    
    const handleDisconnected = () => {
      console.log('ConnectionMonitor: Socket disconnected');
      setConnectionStatus('disconnected');
      // Only show banner after a brief delay to avoid flashing for quick reconnects
      setTimeout(() => {
        const currentStatus = socketService.getConnectionStatus();
        if (currentStatus !== 'connected') {
          console.log('ConnectionMonitor: Still disconnected, showing banner');
          setShowBanner(true);
        }
      }, 3000);
    };
    
    const handleConnectionFailed = () => {
      console.log('ConnectionMonitor: Socket connection failed');
      setConnectionStatus('failed');
      setShowBanner(true);
    };
    
    // Set up event listeners
    window.addEventListener('socket_connected', handleConnected);
    window.addEventListener('socket_disconnected', handleDisconnected);
    window.addEventListener('socket_connection_failed', handleConnectionFailed);
    
    // Check connection status periodically
    const interval = setInterval(() => {
      const currentStatus = socketService.getConnectionStatus();
      if (currentStatus !== connectionStatus) {
        setConnectionStatus(currentStatus);
        setShowBanner(currentStatus !== 'connected');
      }
    }, 5000);
    
    // Clean up
    return () => {
      window.removeEventListener('socket_connected', handleConnected);
      window.removeEventListener('socket_disconnected', handleDisconnected);
      window.removeEventListener('socket_connection_failed', handleConnectionFailed);
      clearInterval(interval);
    };
  }, [connectionStatus]);
  
  const handleReconnect = () => {
    setShowBanner(false);
    socketService.reconnect();
  };
  
   // Modify your return to include debug info when needed
  if (!showBanner && !connectionInfo.lastError) return null;
  
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-red-500 text-white py-2 px-4 flex justify-between items-center z-50">
      <div>
        <span>
          {connectionStatus === 'failed' 
            ? "Connection lost. Please reconnect to receive messages." 
            : connectionStatus === 'connecting'
              ? `Attempting to reconnect (${connectionInfo.attempts}/${MAX_RECONNECT_ATTEMPTS})...`
              : "Connection issue detected."}
        </span>
        {connectionInfo.lastError && (
          <p className="text-xs mt-1 text-red-200">Error: {connectionInfo.lastError}</p>
        )}
      </div>
      <button 
        onClick={handleReconnect}
        className="bg-white text-red-500 px-3 py-1 rounded font-medium"
      >
        Reconnect
      </button>
    </div>
  );
};

export default ConnectionMonitor;