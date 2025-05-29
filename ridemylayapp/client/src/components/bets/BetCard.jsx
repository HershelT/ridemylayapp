import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEllipsisH, FaEdit, FaTrash, FaHeart } from 'react-icons/fa';
import { GiRaceCar } from 'react-icons/gi';
import { betAPI } from '../../services/api';
import socketService from '../../services/socket';
import { useAuth } from '../../hooks/useAuth';
import { useBets } from '../../hooks/useBets';

const BetCard = ({ bet }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { deleteBet } = useBets();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLiked, setIsLiked] = useState(bet.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(bet.likeCount || bet.likes?.length || 0);
  const isOwner = user && bet.userId && user._id === (bet.userId._id || bet.userId);

  // Helper function to get streak display text
  const getStreakText = () => {
    const streak = bet.userId?.streak;
    
    if (streak > 0) return `🔥 ${streak} Win Streak`;
    if (streak < 0) return `❄️ ${Math.abs(streak)} Loss Streak`;
    return 'No streak';
  };

  useEffect(() => {
    // Listen for bet updates
    const cleanup = socketService.onBetUpdate((update) => {      if (update.betId === bet._id) {
        if (update.type === 'like' || update.type === 'unlike') {
          setLikeCount(update.data.likes.length); // Use the actual length of likes array
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
      socketService.emitBetInteraction(bet._id, 'ride', {});
    } catch (error) {
      console.error('Error initiating ride:', error);
    }
  };
  
  const handleHedge = async () => {
    try {
      // Navigate to the post page with pre-filled hedge data
      navigate(`/post?hedge=${bet._id}`);
      
      // Emit socket event for analytics
      socketService.emitBetInteraction(bet._id, 'hedge', {});
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
      socketService.emitBetInteraction(bet._id, 'share', { platform });
      
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

  const handleCardClick = (e) => {
    // Only navigate if the click wasn't on an interactive element
    if (!e.target.closest('button') && !e.target.closest('a')) {
      navigate(`/bets/${bet._id}`);
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={handleCardClick}
    >
      {/* User Info */}
      <div className="flex items-center justify-between mb-3">
        <Link to={`/profile/${bet.userId?._id}`} className="flex items-center">
          <img 
            src={bet.userId?.avatarUrl || `https://api.dicebear.com/9.x/micah/svg?seed=${bet.userId?.username || 'anonymous'}`} 
            alt="User Avatar" 
            className="w-10 h-10 rounded-full"
          />
          <div className="ml-2">
            <div className="flex items-center">
              <span className="font-medium">{bet.userId?.username || 'User'}</span>
              {bet.userId?.verified && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getStreakText()}
            </span>
          </div>
        </Link>
          <div className="ml-auto text-right">          <div className="flex items-center justify-end mb-1">
                <a 
                    href={
                      // Get the betting site from either bettingSiteId or bettingSite object
                      (bet.bettingSiteId?.websiteUrl || bet.bettingSite?.websiteUrl) ||
                      // If no direct websiteUrl, try to determine from name
                      (bet.bettingSiteId?.name || bet.bettingSite?.name)?.toLowerCase().replace(' ', '') ?
                        `https://${(bet.bettingSiteId?.name || bet.bettingSite?.name).toLowerCase().replace(' ', '')}.com` :
                        "https://example.com"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:opacity-80 transition-opacity group"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Track betting site click if needed
                    }}
                >                    <div className="w-5 h-5 mr-1 flex-shrink-0 bg-white dark:bg-black rounded-sm shadow-sm overflow-hidden group-hover:opacity-80">
                        <img
                            src={(bet.bettingSite?.logoUrl || bet.bettingSiteId?.logoUrl) || '/assets/images/placeholder-logo.png'} 
                            alt={(bet.bettingSite?.name || bet.bettingSiteId?.name) || 'Betting Site'} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.src = '/assets/images/placeholder-logo.png';
                                e.target.onerror = null;
                            }}
                            loading="lazy"
                        />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                      {(bet.bettingSite?.name || bet.bettingSiteId?.name) || 'Betting Site'}
                    </span>
                </a>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(bet.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                })} 
                {` • ${new Date(bet.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                })}`}
            </span>
        </div>
      </div>
        
      
      {/* Bet Details */}
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-3">
        <div className="mb-2">
          <span className={`inline-block px-2 py-1 rounded text-xs text-white ${
            bet.status === 'won' ? 'bg-green-500' : 
            bet.status === 'lost' ? 'bg-red-500' : 
            'bg-yellow-500'
          }`}>
            {bet.status === 'won' ? 'Won' : bet.status === 'lost' ? 'Lost' : 'Pending'}
          </span>
        </div>
        
        {/* Parlay Legs */}
        <div className="space-y-2 mb-3">
          {bet.legs?.map((leg, index) => (
            <div key={index} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{leg.team}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{leg.betType}</div>
              </div>
              <div className="text-right">
                <div className={`font-medium ${leg.odds > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {leg.odds > 0 ? `+${leg.odds}` : leg.odds}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Bet Summary */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Stake</div>
              <div className="font-medium">${bet.stake.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-300">Potential Win</div>
              <div className="font-medium text-green-600 dark:text-green-400">${bet.potentialWinnings.toFixed(2)}</div>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Odds</div>
            <div className={`font-medium ${bet.odds > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        {/* Ride Button */}
        <button 
          onClick={handleRide}
          className="flex flex-col items-center justify-center px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-primary-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
          </svg>
          <span className="text-xs mt-1">Ride</span>
        </button>
        
        {!isOwner && (
          <button 
            onClick={handleHedge}
            className="flex flex-col items-center justify-center px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-primary-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-xs mt-1">Hedge</span>
          </button>
        )}
        
        {isOwner && (
          <button 
            onClick={() => navigate(`/post?modify=${bet._id}`)}
            className="flex flex-col items-center justify-center px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-primary-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-xs mt-1">Modify</span>
          </button>
        )}
        
        {/* Like Button */}
        <motion.button 
          onClick={handleLike}
          whileTap={{ scale: 1.2 }}
          className={`flex flex-col items-center justify-center px-3 py-1 ${
            isLiked 
              ? 'text-red-500' 
              : 'text-gray-600 dark:text-gray-300 hover:text-red-500'
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill={isLiked ? 'currentColor' : 'none'} 
            stroke="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M3.172 5.172a4 4 0 005.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
              clipRule="evenodd" 
            />
          </svg>
          <span className="text-xs mt-1">{likeCount}</span>
        </motion.button>
        
        {/* Share Button */}
        <button 
          onClick={handleShare}
          className="flex flex-col items-center justify-center px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-primary-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-xs mt-1">Share</span>
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Share this bet</h3>
            <div className="space-y-3">
              <button 
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                onClick={() => handleShareOption('copy')}
              >
                Copy Link
              </button>
              <button 
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                onClick={() => handleShareOption('whatsapp')}
              >
                Share to WhatsApp
              </button>
              <button 
                className="w-full bg-blue-400 text-white py-2 rounded-lg hover:bg-blue-500"
                onClick={() => handleShareOption('twitter')}
              >
                Share to Twitter
              </button>
              <button 
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600" 
                onClick={() => setShowShareModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BetCard;
