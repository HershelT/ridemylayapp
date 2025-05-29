import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHeart, FaShare, FaEllipsisH, FaCheck, FaTimesCircle } from 'react-icons/fa';
import { GiRaceCar } from 'react-icons/gi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import CommentList from '../components/comments/CommentList';
import useAuthStore from '../store/authStore';
import useCommentStore from '../store/commentStore';
import { betAPI } from '../services/api';
import useBets from '../hooks/useBets';

const BetDetails = () => {  const { id } = useParams();
  const { user } = useAuthStore();
  const { comments, loading: commentsLoading, getComments, addComment, likeComment, deleteComment } = useCommentStore();
  const { deleteBet } = useBets();
  const navigate = useNavigate();
  
  const [bet, setBet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    like: false,
    ride: false,
    hedge: false,
    share: false,
    delete: false
  });

  // Validate bet ID format
  useEffect(() => {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      setError('Invalid bet ID');
      setLoading(false);
      return;
    }
  }, [id]);
  
  // Get bet details when component mounts
  useEffect(() => {
    const fetchBet = async () => {
      try {
        const betResponse = await betAPI.getBet(id);
        setBet(betResponse.data.bet);
        
        // Fetch comments separately to handle loading state properly
        await getComments(id);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load bet details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBet();
  }, [id, getComments]);
  
  // Handle like action
  const handleLike = async () => {
    if (actionLoading.like || !user) return;
    
    setActionLoading(prev => ({ ...prev, like: true }));
    
    try {
      // Optimistic update
      const newIsLiked = !bet.likes?.includes(user._id);      // Optimistic update
      setBet(prev => ({
        ...prev,
        likes: newIsLiked 
          ? [...(prev.likes || []), user._id]
          : (prev.likes || []).filter(id => id !== user._id),
        likeCount: (prev.likes || []).length + (newIsLiked ? 1 : -1) // Use likeCount to match server virtual
      }));

      // Make API call
      const response = await betAPI.toggleLike(id);
      
      if (!response.data.success) {
        // Revert on failure
        setBet(prev => ({
          ...prev,
          likes: newIsLiked
            ? (prev.likes || []).filter(id => id !== user._id)
            : [...(prev.likes || []), user._id],
          likesCount: (prev.likesCount || 0) + (newIsLiked ? -1 : 1)
        }));
      }
    } catch (error) {      // Revert optimistic update on error
      const isCurrentlyLiked = bet.likes?.includes(user._id);
      setBet(prev => ({
        ...prev,
        likes: isCurrentlyLiked
          ? (prev.likes || []).filter(id => id !== user._id)
          : [...(prev.likes || []), user._id],
        likeCount: (prev.likes || []).length + (isCurrentlyLiked ? -1 : 1)
      }));
      console.error('Error liking bet:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, like: false }));
    }
  };
    // Handle ride action
  const handleRide = async () => {
    if (actionLoading.ride || isOwner) return;
    
    setActionLoading(prev => ({ ...prev, ride: true }));
    
    try {
      // Navigate to the post page with the bet ID as a URL parameter
      navigate(`/post?ride=${id}`);
      
      // Optional: You can still call toggleRide if you want to track rides
      // const response = await betAPI.toggleRide(id);
      // setBet(response.data.bet);
    } catch (error) {
      console.error('Error riding bet:', error);
      setActionLoading(prev => ({ ...prev, ride: false }));
    }
  };
    // Handle hedge action
  const handleHedge = async () => {
    if (actionLoading.hedge || isOwner) return;
    
    setActionLoading(prev => ({ ...prev, hedge: true }));
    
    try {
      // Navigate to the post page with the bet ID as a URL parameter
      navigate(`/post?hedge=${id}`);
    } catch (error) {
      console.error('Error initiating hedge:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, hedge: false }));
    }
  };
  
  // Handle share action
  const handleShare = async () => {
    if (actionLoading.share) return;
    
    setActionLoading(prev => ({ ...prev, share: true }));
    
    try {
      // Show native share dialog if available
      if (navigator.share) {
        await navigator.share({
          title: bet.title,
          text: bet.description,
          url: window.location.href,
        });
        
        // Update share count on successful share
        await betAPI.shareBet(id, 'native');
        setBet(prev => ({
          ...prev,
          shares: prev.shares + 1
        }));
      } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
        
        // Update share count
        await betAPI.shareBet(id, 'copy');
        setBet(prev => ({
          ...prev,
          shares: prev.shares + 1
        }));
      }
    } catch (error) {
      console.error('Error sharing bet:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, share: false }));
    }
  };  // Handle adding a comment
  const handleAddComment = async (betId, content, parentId, replyToUsername, replyToUserId) => {
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }
    
    try {
      // Add the comment with reply information if provided
      const newComment = await addComment(betId, content, parentId, replyToUsername, replyToUserId);
      
      if (!newComment) {
        toast.error('Failed to add comment');
        return;
      }

      // Success notification
      toast.success('Comment added successfully');
      
      // No need to refresh comments - the store already has the new comment
      
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(error.message || 'Failed to add comment');
    }
  };
  
  // Handle liking a comment
  const handleLikeComment = async (commentId) => {
    try {
      await likeComment(commentId);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };
  
  // Handle deleting a comment
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };
  
  // Handle delete action
  const handleDelete = async () => {
    if (actionLoading.delete) return;
    
    // Confirm delete
    if (!window.confirm('Are you sure you want to delete this bet? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(prev => ({ ...prev, delete: true }));
    
    try {
      const result = await deleteBet(id);
      
      if (result.success) {
        // Navigate back to the home page after successful deletion
        navigate('/');
      } else {
        setError(result.error || 'Failed to delete bet');
      }
    } catch (error) {
      setError('An error occurred while deleting the bet');
      console.error('Error deleting bet:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };
    if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bet details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">
          <FaTimesCircle className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-center text-gray-600 dark:text-gray-400">{error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!bet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-center text-gray-600 dark:text-gray-400">Bet not found</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }
    const isLiked = bet.likes?.includes(user?._id);
  const isRiding = bet.riders?.includes(user?._id);
  const isHedging = bet.hedgers?.includes(user?._id);
  const isOwner = bet.userId?._id === user?._id || bet.userId === user?._id;
  
  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Back navigation */}
      <div className="mb-4">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Bet header */}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {bet.title}
              </h1>
              <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Link 
                  to={`/profile/${bet.userId?.username || bet.user?.username || bet.userId}`}
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {bet.userId?.username || bet.user?.name || bet.user?.username || 'Unknown User'}
                </Link>
                <span className="mx-1">•</span>
                <span>
                  {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
                </span>
                <span className="mx-1">•</span>
                <span className="capitalize">{bet.sport}</span>
              </div>
            </div>
            
            {/* Bet options button */}
            <div className="relative">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              >
                <FaEllipsisH />
              </button>
                {showOptions && (
                <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {isOwner ? (
                      <>
                        <button
                          onClick={() => {
                            navigate(`/post?modify=${id}`);
                            setShowOptions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                          role="menuitem"
                        >
                          Edit Bet
                        </button>
                        <button
                          onClick={() => {
                            handleDelete();
                            setShowOptions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                          role="menuitem"
                        >
                          Delete Bet
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          navigate(`/post?ride=${id}`);
                          setShowOptions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                        role="menuitem"
                      >
                        Ride This Bet
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // TODO: Implement report functionality
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      role="menuitem"
                    >
                      Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Bet description */}
          {bet.description && (
            <p className="mt-4 text-gray-800 dark:text-gray-200">
              {bet.description}
            </p>
          )}
          
          {/* Bet details */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Stake</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${bet.stake.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Odds</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">To Win</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${bet.potentialWinnings.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p className={`text-lg font-semibold ${
                bet.status === 'won' 
                  ? 'text-green-600 dark:text-green-400' 
                  : bet.status === 'lost' 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
              </p>
            </div>
          </div>
          
          {/* Bet legs */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Bet Legs
            </h3>
            <div className="space-y-3">
              {bet.legs.map((leg, index) => (
                <div 
                  key={index} 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {leg.team}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {leg.sport.charAt(0).toUpperCase() + leg.sport.slice(1)} • {leg.betType.charAt(0).toUpperCase() + leg.betType.slice(1)} • {leg.odds > 0 ? `+${leg.odds}` : leg.odds}
                      </p>
                    </div>
                    <div>
                      {leg.outcome === 'won' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          <FaCheck className="mr-1" />
                          Won
                        </span>
                      )}
                      {leg.outcome === 'lost' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                          <FaTimesCircle className="mr-1" />
                          Lost
                        </span>
                      )}
                      {leg.outcome === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                          Pending
                        </span>
                      )}
                      {leg.outcome === 'push' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          Push
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {leg.sport.charAt(0).toUpperCase() + leg.sport.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Betting site */}
          {bet.bettingSite && (
            <div className="mt-6 flex items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mr-2">Placed on:</p>
              <div className="flex items-center">
                {bet.bettingSite.logo && (                  <div className="h-5 w-5 mr-1 flex-shrink-0 bg-white rounded-sm shadow-sm overflow-hidden">                    <img 
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
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {bet.bettingSite.name}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Action bar */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLike}
              disabled={actionLoading.like}
              className={`flex items-center space-x-1 ${
                isLiked 
                  ? 'text-red-500 dark:text-red-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
              }`}
            >
              <FaHeart className={isLiked ? 'fill-current' : ''} />
              <span>{bet.likeCount || bet.likes?.length || 0}</span>
            </button>
            
            <button 
              onClick={handleRide}
              disabled={actionLoading.ride || isOwner}
              className={`flex items-center space-x-1 ${
                isRiding 
                  ? 'text-green-500 dark:text-green-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400'
              } ${isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <GiRaceCar className={isRiding ? 'fill-current' : ''} />
              <span>{bet.ridesCount || 0}</span>
            </button>
            
            <button
              onClick={handleShare}
              disabled={actionLoading.share}
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
            >
              <FaShare />
              <span>{bet.shares || 0}</span>
            </button>
          </div>
          
          <div>
            <button
              onClick={handleHedge}
              disabled={actionLoading.hedge || isOwner}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                isHedging 
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-800 dark:hover:text-orange-400'
              } ${isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Hedge
            </button>
          </div>
        </div>
      </div>
        {/* Comments section */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <CommentList          betId={id}
          comments={comments[id] || []}
          currentUserId={user?._id}
          onAddComment={handleAddComment}
          onLikeComment={handleLikeComment}
          onDeleteComment={handleDeleteComment}
          loading={commentsLoading}
        />
      </div>
    </div>
  );

};

export default BetDetails;
