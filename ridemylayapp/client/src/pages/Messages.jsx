import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Routes, Route } from 'react-router-dom';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import useAuthStore from '../store/authStore';
import useMessageStore from '../stores/messageStore';
import { messageAPI, chatAPI } from '../services/chatApi';
import { useSocket } from '../providers/SocketProvider';
// Add this to your existing imports
import { useLocation } from 'react-router-dom';


const Messages = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { resetUnreadCount } = useMessageStore();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const location = useLocation();

  
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Reset unread count when entering messages page
  useEffect(() => {
    if (isAuthenticated) {
      resetUnreadCount();
    }
  }, [isAuthenticated, resetUnreadCount]);

  // Load chats initially
  useEffect(() => {
    const loadChats = async () => {
      try {
        const response = await chatAPI.getUserChats();
        setChats(response.data.chats);
        
        // If chatId provided in URL, select that chat
        if (chatId) {
          const chat = response.data.chats.find(c => c._id === chatId);
          if (chat) {
            setSelectedChat(chat);
            markAsRead(chat);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading chats:', error);
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      loadChats();
    }
  }, [isAuthenticated, chatId]);

  // Add this useEffect to handle bet sharing
  useEffect(() => {
    // Check if we have a bet to share
    if (location.state?.shareBet && selectedChat) {
      const sendBetMessage = async () => {
        try {
          // Send message with bet attachment
          const messageData = {
            chatId: selectedChat._id,
            content: "Check out this bet!",
            attachments: [{
              type: 'bet',
              betId: location.state.shareBet.betId
            }]
          };
          
          // Add betData if available
          if (location.state.shareBet.status || 
              location.state.shareBet.odds || 
              location.state.shareBet.stake) {
            messageData.attachments[0].betData = {
              status: location.state.shareBet.status,
              odds: location.state.shareBet.odds,
              stake: location.state.shareBet.stake
            };
          }
          
          await messageAPI.sendMessage(messageData);
          
          // Clear the state to prevent duplicate messages
          navigate(`/messages/${selectedChat._id}`, { replace: true });
        } catch (error) {
          console.error('Error sending bet message:', error);
        }
      };
      
      sendBetMessage();
    }
  }, [location.state, selectedChat, navigate]);

  // Handle chat selection and mark messages as read
  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    navigate(`/messages/${chat._id}`);
    
    if (chat) {
      markAsRead(chat);
    }
  };
  
  const markAsRead = async (chat) => {
    try {
      await messageAPI.markAsRead(chat._id);
      socket.markMessagesAsRead(chat._id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className="h-[calc(100vh-134px)] flex">
      {/* Chat List Sidebar */}
      <div className={`${
        isMobileView && selectedChat ? 'hidden' : 'w-full md:w-1/3 lg:w-1/4'
      } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}>
        <ChatList 
          chats={chats}
          onSelectChat={handleSelectChat}
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
            onBack={() => {
              setSelectedChat(null);
              navigate('/messages');
            }}
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