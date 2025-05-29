import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEllipsisH, FaEdit, FaTrash, FaHeart } from 'react-icons/fa';
import { GiRaceCar } from 'react-icons/gi';
import { betAPI } from '../../services/api';
import { emitBetInteraction, onBetUpdate } from '../../services/socket';
import { useAuth } from '../../hooks/useAuth';
import { useBets } from '../../hooks/useBets';

const BetCard = ({ bet }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { deleteBet } = useBets();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLiked, setIsLiked] = useState(bet.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(bet.likes?.length || 0);
  const isOwner = user && bet.userId && user._id === bet.userId._id;

  useEffect(() => {
    // Listen for bet updates
    const cleanup = onBetUpdate((update) => {
      if (update.betId === bet._id) {
        if (update.type === 'like' || update.type === 'unlike') {
          setLikeCount(update.data.likesCount);
          setIsLiked(update.data.likes.includes(user?._id));
        }
      }
    });

    return cleanup;
  }, [bet._id, user?._id]);
  
  const handleLike = async () => {
    if (!user) return;
    
    try {
      const newIsLiked = !isLiked;
      
      // Optimistic update
      setIsLiked(newIsLiked);
      setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
      
      // Call the API to toggle like status
      const response = await betAPI.toggleLike(bet._id);
      
      if (!response.data.success) {
        // Revert on failure
        setIsLiked(!newIsLiked);
        setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
      console.error('Error toggling like:', error);
    }
  };

  const handleRide = async () => {
    try {
      // Navigate to the post page with pre-filled ride data
      navigate(`/post?ride=${bet._id}`);
      
      // Emit socket event for analytics
      emitBetInteraction(bet._id, 'ride', {});
    } catch (error) {
      console.error('Error initiating ride:', error);
    }
  };
  
  const handleHedge = async () => {
    try {
      // Navigate to the post page with pre-filled hedge data
      navigate(`/post?hedge=${bet._id}`);
      
      // Emit socket event for analytics
      emitBetInteraction(bet._id, 'hedge', {});
    } catch (error) {
      console.error('Error initiating hedge:', error);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };
  
  const handleShareOption = async (platform) => {
    try {
      // Create share URL
      const shareUrl = `${window.location.origin}/bets/${bet._id}`;
      
      // Handle different sharing platforms
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(shareUrl);
          alert('Link copied to clipboard!');
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=Check out this bet! ${shareUrl}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=Check out this bet!&url=${shareUrl}`, '_blank');
          break;
        default:
          break;
      }
      
      // Emit socket event for analytics
      emitBetInteraction(bet._id, 'share', { platform });
      
      // Close modal
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing bet:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this bet? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await deleteBet(bet._id);
      
      if (!result.success) {
        console.error('Error deleting bet:', result.error);
      }
    } catch (error) {
      console.error('Error deleting bet:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Bet Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Link to={`/profile/${bet.userId?.username}`} className="flex items-center">
            <img 
              src={bet.userId?.avatarUrl || `https://api.dicebear.com/7.x/micah/svg?seed=${bet.userId?.username}`}
              alt={bet.userId?.username}
              className="w-10 h-10 rounded-full"
            />
            <div className="ml-3">
              <span className="font-medium text-gray-900 dark:text-white">{bet.userId?.username}</span>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(bet.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Link>
        </div>

        {/* Bet Details */}
        <div className="space-y-4">
          <div className="text-gray-900 dark:text-white text-lg font-medium">{bet.title}</div>
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Stake:</span>
              <span className="ml-2 font-medium">${bet.stake.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Potential Win:</span>
              <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                ${bet.potentialWinnings.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center space-x-1 ${
                isLiked 
                  ? 'text-red-500' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <FaHeart className={isLiked ? 'fill-current' : ''} />
              <span>{likeCount}</span>
            </motion.button>

            {!isOwner && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRide}
                className="flex items-center space-x-1 text-gray-500 hover:text-green-500"
              >
                <GiRaceCar />
                <span>Ride</span>
              </motion.button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => navigate(`/post?modify=${bet._id}`)}
                  className="text-gray-500 hover:text-blue-500"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={handleDelete}
                  className="text-gray-500 hover:text-red-500"
                >
                  <FaTrash />
                </button>
              </>
            ) : (
              <button
                onClick={handleHedge}
                className="text-gray-500 hover:text-orange-500"
              >
                Hedge
              </button>
            )}
            <button
              onClick={handleShare}
              className="text-gray-500 hover:text-blue-500"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-4 w-80 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-3">Share this bet</h3>
            
            <button 
              onClick={() => handleShareOption('copy')}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
            >
              Copy Link
            </button>
            
            <button 
              onClick={() => handleShareOption('whatsapp')}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
            >
              Share to WhatsApp
            </button>
            
            <button 
              onClick={() => handleShareOption('twitter')}
              className="w-full bg-blue-400 text-white py-2 rounded-lg hover:bg-blue-500"
            >
              Share to Twitter
            </button>
            
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BetCard;
