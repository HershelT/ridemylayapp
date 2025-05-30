import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaArrowLeft, FaEllipsisV, FaImage, FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';
import { messageAPI } from '../../services/chatApi';
import useAuthStore from '../../store/authStore';
import { getInitials } from '../../utils/formatters';
import socketService from '../../services/socket';
import MessageStatus from './MessageStatus';
import MessageAttachment from './MessageAttachment';
import UserPresence from '../common/UserPresence';

const ChatWindow = ({ chat, onBack, isMobileView }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const otherUser = chat.isGroupChat ? null : chat.users.find(u => u._id !== user._id);
  
  // New functions for attachments
  const handleImageAttachment = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';
      
      // Here you would normally upload the file to your server/cloud storage
      // For demo purposes, we'll use a local URL
      const fileUrl = URL.createObjectURL(file);
      
      setAttachments([...attachments, {
        type: fileType,
        url: fileUrl,
        file: file // Keep the file for actual upload
      }]);
    }
  };

  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

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

    // Join chat room and subscribe to notifications
    socketService.joinChatRoom(chat._id);
    socketService.subscribeToNotifications();
    fetchMessages();

    // Setup message listener
   // Update in the useEffect where socket listeners are set up (around line 70)
  const messageCleanup = socketService.onMessageReceived((message) => {
    // Verify we're receiving the correct chat ID format
    console.log('Received message:', message); // Add this for debugging
    
    // Check both string and object formats for compatibility
    const messageChat = typeof message.chat === 'object' ? message.chat._id : message.chat;
    const currentChat = typeof chat._id === 'object' ? chat._id.toString() : chat._id;
    
    if (messageChat === currentChat && message.sender._id !== user._id) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      // Mark message as read since we're in the chat
      socketService.markMessagesAsRead(chat._id);
    }
  });

    // Setup notification listener
    const notificationCleanup = socketService.onNewNotification((notification) => {
      if (notification.entityType === 'chat' && notification.entityId === chat._id) {
        // Chat notifications will be handled by the notification system
        console.log('New chat notification received:', notification);
      }
    });

    // Setup typing listener
    const typingCleanup = socketService.onUserTyping(({ chatId, isTyping, username }) => {
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
      socketService.leaveChatRoom(chat._id);
      messageCleanup();
      notificationCleanup();
      typingCleanup();
    };
  }, [chat._id, user._id]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle typing events
  const typingTimeoutRef = useRef(null);
  const handleTyping = () => {
    if (!typingTimeoutRef.current) {
      socketService.typingInChat(chat._id, true);
    }
    
    // Clear previous timeout
    clearTimeout(typingTimeoutRef.current);
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      socketService.typingInChat(chat._id, false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && attachments.length === 0) || !chat) return;
    
    try {
      console.log('Sending message to chat:', chat._id);
      // Here you would normally upload any files to your server first
      // For demo, we'll just use the URLs we already have
      const processedAttachments = attachments.map(att => ({
        type: att.type,
        url: att.url,
        betId: att.betId // Include if present
      }));
      
      const response = await messageAPI.sendMessage({
        content: newMessage,
        chatId: chat._id,
        attachments: processedAttachments
      });

      console.log('Message sent, server response:', response.data);

      const newMsg = response.data.message;
      setMessages(prev => [...prev, newMsg]);
      
      // Send through socket for real-time updates to other users
      console.log('Emitting message via socket');
      socketService.sendChatMessage({
        ...newMsg,
        chat: chat._id
      });

      setNewMessage('');
      setAttachments([]); // Clear attachments after sending
      scrollToBottom();

      // Clear typing state
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        socketService.typingInChat(chat._id, false);
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
          {chat.isGroupChat ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {chat.users.length} members
            </p>
          ) : (
            <UserPresence 
              isOnline={otherUser?.isOnline} 
              lastActive={otherUser?.lastActive} 
            />
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
                <div>
                  {/* Message bubble */}
                  <div className={`inline-block max-w-[85%] md:max-w-[70%] ${isSender ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'} px-4 py-2 rounded-2xl`}>
                    {message.content}
                    
                    {/* Message status (read/delivered indicators) */}
                    <MessageStatus 
                      message={message}
                      currentUser={user}
                      otherUsers={chat.users.filter(u => u._id !== user._id)}
                    />
                  </div>

                  {/* Message attachments - render below the text */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className={`mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
                      {message.attachments.map((attachment, idx) => (
                        <MessageAttachment key={idx} attachment={attachment} />
                      ))}
                    </div>
                  )}
                  
                  {/* Message timestamp */}
                  <div className={`text-xs text-gray-500 mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
                    {format(new Date(message.createdAt), 'HH:mm')}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
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
        {/* Attachment preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative">
                {attachment.type === 'image' && (
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img 
                      src={attachment.url} 
                      alt="Attachment preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {attachment.type === 'video' && (
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">Video</span>
                  </div>
                )}
                {attachment.type === 'bet' && (
                  <div className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
                    <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      Shared Bet
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex space-x-2">
          {/* Attachment buttons */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleImageAttachment}
              className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
            >
              <FaImage className="h-5 w-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
          </div>
          
          {/* Text input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          
          {/* Send button */}
          <button
            type="submit"
            disabled={!newMessage.trim() && attachments.length === 0}
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