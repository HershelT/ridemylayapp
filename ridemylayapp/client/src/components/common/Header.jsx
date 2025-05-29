import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import NotificationBadge from '../notifications/NotificationBadge';
import NotificationList from '../notifications/NotificationList';
import useMessageStore from '../../stores/messageStore';
import { useAuth } from '../../hooks/useAuth';
import socket from '../../services/socket';

const Header = ({ toggleTheme }) => {
  const { unreadCount, fetchUnreadCount, incrementUnreadCount } = useMessageStore();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const notificationsRef = useRef(null);

  // Close notifications when clicking outside
  const handleClickOutside = (event) => {
    if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
  };

  // Fetch initial unread count and set up socket listeners
  React.useEffect(() => {
    fetchUnreadCount();

    // Set up socket listener for new messages
    socket.on('new_message', (data) => {
      // Only increment if message is not from current user
      if (data.sender !== user?._id) {
        incrementUnreadCount();
      }
    });

    return () => {
      socket.off('new_message');
    };
  }, [fetchUnreadCount]);

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <header className="fixed top-0 left-0 w-full bg-white dark:bg-gray-800 shadow-md z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-primary-500">
          RideMyLay
        </Link>
        
        <div className="flex items-center space-x-4">          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <NotificationBadge />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96">
                <NotificationList />
              </div>
            )}
          </div>
          
          {/* Messages */}
          <Link to="/messages" className="relative">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </Link>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
