import React from 'react';
import { FaCheck, FaCheckDouble } from 'react-icons/fa';

const MessageStatus = ({ message, currentUser, otherUsers }) => {
  if (!message || !currentUser) return null;
  
  // Only show status for messages sent by current user
  if (message.sender._id !== currentUser._id) return null;
  
  // Check if readBy is an array and contains at least one other user
  const isRead = Array.isArray(message.readBy) && 
                message.readBy.some(id => 
                  otherUsers.some(user => 
                    user._id === id || user._id.toString() === id.toString()
                  )
                );
  
  return (
    <span className="ml-1">
      {isRead ? (
        <FaCheckDouble className="text-blue-500 inline-block" size={10} />
      ) : (
        <FaCheck className="text-gray-400 inline-block" size={10} />
      )}
    </span>
  );
};

export default MessageStatus;