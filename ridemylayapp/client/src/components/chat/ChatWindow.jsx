import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaArrowLeft, FaEllipsisV } from 'react-icons/fa';
import { format } from 'date-fns';
import { messageAPI } from '../../services/chatApi';
import useAuthStore from '../../store/authStore';
import { getInitials } from '../../utils/formatters';
import { 
  joinChatRoom, 
  leaveChatRoom, 
  sendChatMessage, 
  typingInChat, 
  markMessagesAsRead,
  onMessageReceived,
  onUserTyping
} from '../../services/socket';

const ChatWindow = ({ chat, onBack, isMobileView }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  const otherUser = chat.isGroupChat ? null : chat.users.find(u => u._id !== user._id);
  // Fetch messages and setup socket listeners when chat changes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await messageAPI.getMessages(chat._id);
        setMessages(response.data.messages);
        setLoading(false);
        scrollToBottom();
      } catch (error) {
        setError('Failed to load messages');
        console.error('Error fetching messages:', error);
      }
    };

    // Join chat room
    joinChatRoom(chat._id);
    fetchMessages();

    // Setup message listener
    const messageCleanup = onMessageReceived((message) => {
      if (message.chat === chat._id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        markMessagesAsRead(chat._id);
      }
    });

    // Setup typing listener
    const typingCleanup = onUserTyping(({ chatId, isTyping, username }) => {
      if (chatId === chat._id) {
        setTypingUsers(prev => {
          if (isTyping) {
            return [...new Set([...prev, username])];
          } else {
            return prev.filter(u => u !== username);
          }
        });
      }
    });

    // Cleanup function
    return () => {
      leaveChatRoom(chat._id);
      messageCleanup();
      typingCleanup();
    };
  }, [chat._id]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  // Handle typing events
  const typingTimeoutRef = useRef(null);
  const handleTyping = () => {
    if (!typingTimeoutRef.current) {
      typingInChat(chat._id, true);
    }
    
    // Clear previous timeout
    clearTimeout(typingTimeoutRef.current);
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      typingInChat(chat._id, false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await messageAPI.sendMessage({
        chatId: chat._id,
        content: newMessage
      });

      // Send through socket
      sendChatMessage({
        ...response.data.message,
        chat: chat._id
      });

      setMessages([...messages, response.data.message]);
      setNewMessage('');
      scrollToBottom();

      // Clear typing state
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingInChat(chat._id, false);
        typingTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center">
        {isMobileView && (
          <button
            onClick={onBack}
            className="mr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <FaArrowLeft />
          </button>
        )}
        
        {/* Avatar */}
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
          {chat.avatarUrl ? (
            <img
              src={chat.avatarUrl}
              alt={chat.isGroupChat ? chat.name : otherUser?.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {chat.isGroupChat 
                ? getInitials(chat.name)
                : getInitials(otherUser?.username)}
            </span>
          )}
        </div>

        {/* Chat Info */}
        <div className="ml-3 flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {chat.isGroupChat ? chat.name : otherUser?.username}
          </h3>
          {chat.isGroupChat && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {chat.users.length} members
            </p>
          )}
        </div>

        {/* Options Button */}
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FaEllipsisV />
          </button>

          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
              <div className="py-1">
                {chat.isGroupChat && (
                  <>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Group Info
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Add Members
                    </button>
                  </>
                )}
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Clear Chat
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  {chat.isGroupChat ? 'Leave Group' : 'Delete Chat'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 dark:text-red-400 text-center">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center">No messages yet</div>
        ) : (
          messages.map((message, index) => {
            const isSender = message.sender._id === user._id;
            const showAvatar = index === 0 || 
              messages[index - 1].sender._id !== message.sender._id;

            return (
              <div
                key={message._id}
                className={`flex items-end space-x-2 ${isSender ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {showAvatar && !isSender && (
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                    {message.sender.avatarUrl ? (
                      <img
                        src={message.sender.avatarUrl}
                        alt={message.sender.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {getInitials(message.sender.username)}
                      </span>
                    )}
                  </div>
                )}
                {!showAvatar && !isSender && <div className="w-8" />}
                <div className={`max-w-[70%] ${isSender ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'} px-4 py-2 rounded-2xl`}>
                  {message.content}
                  <div className={`text-xs mt-1 ${isSender ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    {format(new Date(message.createdAt), 'HH:mm')}
                  </div>
                </div>
              </div>
            );
          })
        )}          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 p-2">
              <div className="flex space-x-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>•</span>
              </div>
              <span>
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
