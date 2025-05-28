import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { betAPI } from '../../services/api';
import { emitBetInteraction } from '../../services/socket';
import { useAuth } from '../../hooks/useAuth';
import { useBets } from '../../hooks/useBets';

const BetCard = ({ bet }) => {
  const [liked, setLiked] = useState(bet.liked || false);
  const [likeCount, setLikeCount] = useState(bet.likes?.length || 0);
  const [showShareModal, setShowShareModal] = useState(false);
    const { toggleLike } = useBets();
  const { user } = useAuth();
  
  const handleLike = async () => {
    // Optimistic UI update
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    
    try {
      // Call API to update like status
      const response = await betAPI.toggleLike(bet._id);
      
      // Update with actual response from server
      setLiked(response.data.isLiked);
      setLikeCount(response.data.likes);
      
      // Emit socket event for real-time updates
      emitBetInteraction(bet._id, 'like', {
        isLiked: response.data.isLiked,
        likeCount: response.data.likes
      });
    } catch (error) {
      // Revert optimistic update on error
      setLiked(!liked);
      setLikeCount(liked ? likeCount + 1 : likeCount - 1);
      console.error('Error toggling like:', error);
    }
  };
    const handleRide = async () => {
    try {
      // Implement ride functionality
      // First navigate to the post page with pre-filled ride data
      window.location.href = `/post?ride=${bet._id}`;
      
      // Emit socket event for analytics
      emitBetInteraction(bet._id, 'ride', {});
    } catch (error) {
      console.error('Error initiating ride:', error);
    }
  };
  
  const handleHedge = async () => {
    try {
      // Implement hedge functionality
      // Navigate to the post page with pre-filled hedge data
      window.location.href = `/post?hedge=${bet._id}`;
      
      // Emit socket event for analytics
      emitBetInteraction(bet._id, 'hedge', {});
    } catch (error) {
      console.error('Error initiating hedge:', error);
    }
  };
    const handleModify = () => {
    // Navigate to the post page with pre-filled data for modification
    window.location.href = `/post?modify=${bet._id}`;
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
          navigator.clipboard.writeText(shareUrl);
          // You might want to show a toast notification here
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
  
  return (
    <div className="card mb-4">
      {/* User Info */}
      <div className="flex items-center mb-3">
        <Link to={`/profile/${bet.userId}`} className="flex items-center">
          <img 
            src={bet.user?.avatarUrl || 'https://via.placeholder.com/40'} 
            alt="User Avatar" 
            className="w-10 h-10 rounded-full"
          />
          <div className="ml-2">
            <div className="flex items-center">
              <span className="font-medium">{bet.user?.username || 'User'}</span>
              {bet.user?.verified && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {bet.user?.streak > 0 ? `🔥 ${bet.user.streak} Win Streak` : bet.user?.streak < 0 ? `❄️ ${Math.abs(bet.user.streak)} Loss Streak` : 'No streak'}
            </span>
          </div>
        </Link>
        
        <div className="ml-auto text-right">
          <div className="flex items-center justify-end">
            <img 
              src={bet.bettingSite?.logoUrl || 'https://via.placeholder.com/20'} 
              alt="Betting Site" 
              className="w-5 h-5 mr-1"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{bet.bettingSite?.name || 'Betting Site'}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(bet.timestamp).toLocaleDateString()}
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
        
        {/* Hedge Button */}
        <button 
          onClick={handleHedge}
          className="flex flex-col items-center justify-center px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-primary-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span className="text-xs mt-1">Hedge</span>
        </button>
        
        {/* Modify Button */}
        <button 
          onClick={handleModify}
          className="flex flex-col items-center justify-center px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-primary-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-xs mt-1">Modify</span>
        </button>
        
        {/* Like Button */}
        <motion.button 
          onClick={handleLike}
          whileTap={{ scale: 1.2 }}
          className={`flex flex-col items-center justify-center px-3 py-1 ${liked ? 'text-red-500' : 'text-gray-600 dark:text-gray-300 hover:text-red-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={liked ? 'currentColor' : 'none'} stroke="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
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
                className="w-full bg-blue-500 text-white py-2 rounded-lg"
                onClick={() => handleShareOption('copy')}
              >
                Copy Link
              </button>
              <button 
                className="w-full bg-green-500 text-white py-2 rounded-lg"
                onClick={() => handleShareOption('whatsapp')}
              >
                Share to WhatsApp
              </button>
              <button 
                className="w-full bg-blue-400 text-white py-2 rounded-lg"
                onClick={() => handleShareOption('twitter')}
              >
                Share to Twitter
              </button>
              <button 
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-2 rounded-lg" 
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
