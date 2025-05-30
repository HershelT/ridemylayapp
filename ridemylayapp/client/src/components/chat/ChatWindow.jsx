import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPaperPlane, 
  FaArrowLeft, 
  FaEllipsisV, 
  FaImage, 
  FaTimes, 
  FaSmile, 
  FaLink, 
  FaPaperclip 
} from 'react-icons/fa';
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
  const messageContainerRef = useRef(null);
  const [showOptions, setShowOptions] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

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
  
  // Add emoji to message
  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  // Fetch messages and setup socket listeners when chat changes
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setInitialScrollDone(false);
    
    const fetchMessages = async () => {
      try {
        const response = await messageAPI.getMessages(chat._id);
        setMessages(response.data.messages);
        setLoading(false);
        
        // Mark messages as read right after fetching them
        console.log(`ChatWindow: Marking messages as read for chat ${chat._id}`);
        await socketService.markMessagesAsRead(chat._id);
        
        // Scroll to bottom after a slight delay to ensure rendering is complete
        setTimeout(() => {
          scrollToBottom();
          setInitialScrollDone(true);
        }, 100);
      } catch (error) {
        setError('Failed to load messages');
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };

    // Join chat room and subscribe to notifications
    socketService.joinChatRoom(chat._id);
    socketService.subscribeToNotifications();
    fetchMessages();

    // Setup message listener with improved message read marking
    const messageCleanup = socketService.onMessageReceived((message) => {
      // Verify we're receiving the correct chat ID format
      console.log('Received message:', message);
      
      // Check both string and object formats for compatibility
      const messageChat = typeof message.chat === 'object' ? message.chat._id : message.chat;
      const currentChat = typeof chat._id === 'object' ? chat._id.toString() : chat._id;
      
      if (messageChat === currentChat && message.sender._id !== user._id) {
        console.log('ChatWindow: New message received in current chat');
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(m => m._id === message._id);
          if (messageExists) return prev;
          return [...prev, message];
        });
        
        // Only auto-scroll to bottom if user is already at/near the bottom
        if (isNearBottom()) {
          scrollToBottom();
        }
        
        // Mark message as read since we're in the chat
        // Add a small delay to ensure the message is processed first
        setTimeout(() => {
          console.log('ChatWindow: Marking messages as read after new message');
          socketService.markMessagesAsRead(chat._id);
        }, 100);
      }
    });

    // Setup notification listener
    const notificationCleanup = socketService.onNewNotification((notification) => {
      if (notification.entityType === 'chat' && notification.entityId === chat._id) {
        // Auto-mark as read if we're in the chat
        console.log('Auto-marking notification as read since we are in the chat:', notification._id);
        if (notification._id) {
          socketService.markNotificationAsRead(notification._id);
        }
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
        
        // Auto-scroll to bottom when someone is typing if we're already near bottom
        if (isTyping && isNearBottom()) {
          scrollToBottom();
        }
      }
    });

    // Cleanup function
    return () => {
      console.log('ChatWindow: Cleaning up message listeners');
      socketService.leaveChatRoom(chat._id);
      messageCleanup();
      notificationCleanup();
      typingCleanup();
      
      // Clear any typing indicators when leaving
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        socketService.typingInChat(chat._id, false);
        typingTimeoutRef.current = null;
      }
    };
  }, [chat._id, user._id]);

  // Check if user is near bottom of the message container
  const isNearBottom = () => {
    if (!messageContainerRef.current) return true;
    
    const container = messageContainerRef.current;
    const threshold = 150; // px from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Smooth scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: initialScrollDone ? 'smooth' : 'auto' });
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

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center shadow-sm">
        {isMobileView && (
          <button
            onClick={onBack}
            className="mr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1"
          >
            <FaArrowLeft />
          </button>
        )}
        
        {/* Avatar */}
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center overflow-hidden">
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
        <div className="ml-3 flex-1 truncate">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {chat.isGroupChat ? chat.name : otherUser?.username}
          </h3>
          {chat.isGroupChat ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <FaEllipsisV />
          </button>

          {showOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
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
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 dark:text-red-400 text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <FaPaperPlane className="text-indigo-500 dark:text-indigo-400 h-8 w-8" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">No messages yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Be the first to start the conversation!</p>
          </div>
        ) : (
          Object.keys(groupedMessages).map(date => (
            <div key={date} className="space-y-4">
              {/* Date Separator */}
              <div className="flex items-center justify-center">
                <div className="bg-gray-200 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 rounded-full px-3 py-1">
                  {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
              </div>
              
              {/* Messages for this date */}
              {groupedMessages[date].map((message, index) => {
                const isSender = message.sender._id === user._id;
                const showAvatar = index === 0 || 
                  groupedMessages[date][index - 1].sender._id !== message.sender._id;
                const isLastInGroup = index === groupedMessages[date].length - 1 || 
                  groupedMessages[date][index + 1].sender._id !== message.sender._id;

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
                    <div className={`max-w-[85%] md:max-w-[70%]`}>
                      {/* Sender name for group chats */}
                      {chat.isGroupChat && showAvatar && !isSender && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 ml-1 mb-1">
                          {message.sender.username}
                        </div>
                      )}
                    
                      {/* Message bubble */}
                      <div 
                        className={`inline-block px-4 py-2 rounded-2xl ${
                          isSender 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                        } ${
                          // Adjust bubble shape based on position in group
                          showAvatar 
                            ? isSender ? 'rounded-tr-none' : 'rounded-tl-none' 
                            : isSender ? 'rounded-tr-xl' : 'rounded-tl-xl'
                        }`}
                      >
                        {message.content}
                        
                        {/* Message status (read/delivered indicators) */}
                        {isLastInGroup && isSender && (
                          <MessageStatus 
                            message={message}
                            currentUser={user}
                            otherUsers={chat.users.filter(u => u._id !== user._id)}
                          />
                        )}
                      </div>

                      {/* Message attachments - render below the text */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className={`mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
                          {message.attachments.map((attachment, idx) => (
                            <MessageAttachment key={idx} attachment={attachment} />
                          ))}
                        </div>
                      )}
                      
                      {/* Message timestamp - only show for last message in a group */}
                      {isLastInGroup && (
                        <div className={`text-xs text-gray-500 mt-1 ${isSender ? 'text-right mr-1' : 'text-left ml-1'}`}>
                          {format(new Date(message.createdAt), 'HH:mm')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 p-2 bg-white dark:bg-gray-800 rounded-full inline-block shadow-sm">
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
      <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        {/* Attachment preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative">
                {attachment.type === 'image' && (
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                    <img 
                      src={attachment.url} 
                      alt="Attachment preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {attachment.type === 'video' && (
                  <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                    <span className="text-gray-500 dark:text-gray-400">Video</span>
                  </div>
                )}
                {attachment.type === 'bet' && (
                  <div className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-md border border-indigo-200 dark:border-indigo-800">
                    <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      Shared Bet
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end space-x-2">
          {/* Attachment buttons */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handleImageAttachment}
              className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Attach image"
            >
              <FaImage className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Add emoji"
            >
              <FaSmile className="h-5 w-5" />
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
          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[42px]"
            />
            
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10">
                <div className="grid grid-cols-8 gap-1">
                  {["😊", "😂", "❤️", "👍", "🔥", "🎉", "👏", "😍", 
                    "😎", "🤔", "😢", "😡", "🥳", "😴", "🤑", "🤯",
                    "👋", "🙏", "💪", "🤝", "🎯", "⚡", "💯", "🏆"].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => addEmoji(emoji)}
                      className="w-8 h-8 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Send button */}
          <button
            type="submit"
            disabled={!newMessage.trim() && attachments.length === 0}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;