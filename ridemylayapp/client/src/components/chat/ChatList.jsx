import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaUserPlus } from 'react-icons/fa';
import { format } from 'date-fns';
import { chatAPI } from '../../services/chatApi';
import useAuthStore from '../../store/authStore';
import { getInitials } from '../../utils/formatters';
import NewChatModal from './NewChatModal';
import NewGroupModal from './NewGroupModal';

const ChatList = ({ onSelectChat, selectedChat }) => {
  const { user } = useAuthStore();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);

  // Fetch user's chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await chatAPI.getUserChats();
        setChats(response.data.chats);
      } catch (error) {
        setError('Failed to load chats');
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  // Filter chats based on search query
  const filteredChats = chats.filter(chat => {
    const searchLower = searchQuery.toLowerCase();
    if (chat.isGroupChat) {
      return chat.name.toLowerCase().includes(searchLower);
    } else {
      const otherUser = chat.users.find(u => u._id !== user._id);
      return otherUser.username.toLowerCase().includes(searchLower);
    }
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Messages</h2>
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>      {/* New Chat/Group Buttons */}
      <div className="p-4 flex space-x-2">
        <button
          onClick={() => setShowNewChatModal(true)}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          <FaPlus className="mr-2" />
          New Chat
        </button>
        <button
          onClick={() => setShowNewGroupModal(true)}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
        >
          <FaUserPlus className="mr-2" />
          New Group
        </button>
      </div>

      {/* Modals */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={(chat) => {
            setChats([chat, ...chats]);
            onSelectChat(chat);
          }}
        />
      )}
      {showNewGroupModal && (
        <NewGroupModal
          onClose={() => setShowNewGroupModal(false)}
          onGroupCreated={(chat) => {
            setChats([chat, ...chats]);
            onSelectChat(chat);
          }}
        />
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="p-4 text-red-500 dark:text-red-400">{error}</div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No chats found' : 'No chats yet'}
          </div>
        ) : (
          filteredChats.map(chat => {
            const isSelected = selectedChat?._id === chat._id;
            const otherUser = chat.isGroupChat ? null : chat.users.find(u => u._id !== user._id);
            const lastMessage = chat.latestMessage;

            return (
              <button
                key={chat._id}
                onClick={() => onSelectChat(chat)}
                className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                  {chat.avatarUrl ? (
                    <img
                      src={chat.avatarUrl}
                      alt={chat.isGroupChat ? chat.name : otherUser?.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
                      {chat.isGroupChat 
                        ? getInitials(chat.name)
                        : getInitials(otherUser?.username)}
                    </span>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {chat.isGroupChat ? chat.name : otherUser?.username}
                    </h3>
                    {lastMessage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(lastMessage.createdAt), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                    {lastMessage ? lastMessage.content : 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
