import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import useAuthStore from '../store/authStore';

const Messages = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Chat List Sidebar */}
      <div className={`${
        isMobileView && selectedChat ? 'hidden' : 'w-full md:w-1/3 lg:w-1/4'
      } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}>
        <ChatList 
          onSelectChat={setSelectedChat}
          selectedChat={selectedChat}
        />
      </div>

      {/* Chat Window */}
      <div className={`${
        isMobileView && !selectedChat ? 'hidden' : 'flex-1'
      } bg-gray-50 dark:bg-gray-900`}>
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            onBack={() => setSelectedChat(null)}
            isMobileView={isMobileView}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
