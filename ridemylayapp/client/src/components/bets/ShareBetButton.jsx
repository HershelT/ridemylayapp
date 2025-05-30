import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShare, FaComment } from 'react-icons/fa';
import { chatAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

const ShareBetButton = ({ bet }) => {
  const { user } = useAuthStore();
  const [showOptions, setShowOptions] = useState(false);
  const navigate = useNavigate();
  
  const handleShareToChat = async (existing = true) => {
    if (existing) {
      // Navigate to messages with bet data in state
      navigate('/messages', { 
        state: { 
          shareBet: {
            betId: bet._id,
            status: bet.status,
            odds: bet.odds,
            stake: bet.stake
          }
        }
      });
    } else {
      // Create a new chat with the bet creator if not the current user
      try {
        const betUserId = bet.userId?._id || bet.userId;
        
        if (betUserId === user._id) {
          // Can't message yourself
          return;
        }
        
        const response = await chatAPI.accessChat(betUserId);
        const chatId = response.data.chat._id;
        
        // Navigate to this specific chat with bet data
        navigate(`/messages/${chatId}`, {
          state: { 
            shareBet: {
              betId: bet._id,
              status: bet.status,
              odds: bet.odds,
              stake: bet.stake
            }
          }
        });
      } catch (error) {
        console.error('Error creating chat:', error);
      }
    }
    
    setShowOptions(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex flex-col items-center justify-center px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-primary-500"
      >
        <FaShare className="h-5 w-5" />
        <span className="text-xs mt-1">Share</span>
      </button>
      
      {showOptions && (
        <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 w-48 z-10">
          <button 
            onClick={() => handleShareToChat(true)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
          >
            <FaComment className="mr-2" />
            <span>Share to existing chat</span>
          </button>
          <button
            onClick={() => handleShareToChat(false)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
          >
            <FaShare className="mr-2" />
            <span>Message bet creator</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareBetButton;