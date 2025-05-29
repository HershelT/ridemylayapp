import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaEllipsisH, FaHeart, FaReply } from 'react-icons/fa';

const Comment = ({ comment, onLike, onReply, onDelete, currentUserId }) => {
  const [showOptions, setShowOptions] = React.useState(false);
  if (!comment) {
    return null; // Don't render anything if comment is undefined
  }  // First handle user info to avoid null reference errors
  const userInfo = comment.user || { 
    username: 'Anonymous', 
    _id: null, 
    avatarUrl: null 
  };
  
  // Then safely destructure with defaults
  const { 
    _id, 
    content = '', 
    createdAt,
    likes = []
  } = comment;
  
  // Ensure we have required data
  if (!content) {
    return null;
  }

  const isLiked = Array.isArray(likes) && likes.includes(currentUserId);
  const isOwner = userInfo._id === currentUserId;
  
  const handleDelete = () => {
    if (isOwner && onDelete) {
      onDelete(_id);
    }
    setShowOptions(false);
  };

  const handleLike = () => {
    if (onLike) {
      onLike(_id);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(_id);
    }
    setShowOptions(false);
  };
  
  return (
    <div className="flex space-x-3 py-3 border-b border-gray-700/20">      <div className="flex-shrink-0">        <Link to={userInfo._id ? `/profile/${userInfo._id}` : '#'}>
          <img 
            src={userInfo.avatarUrl || `https://api.dicebear.com/9.x/icons/svg?seed=${userInfo.username || 'anonymous'}`} 
            alt={userInfo.username || 'User'}
            className="h-9 w-9 rounded-full object-cover" 
          />
        </Link>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>            <Link 
              to={userInfo._id ? `/profile/${userInfo._id}` : '#'}
              className="font-medium text-gray-900 dark:text-white hover:underline"
            >
              {userInfo.name || userInfo.username || 'Anonymous'}
            </Link>
            <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
              @{userInfo.username || 'anonymous'}
            </span>
            <span className="mx-1 text-gray-500 dark:text-gray-400">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(createdAt || Date.now()), { addSuffix: true })}
            </span>
          </div>
          
          <div className="relative">
            {(isOwner || onReply) && (
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              >
                <FaEllipsisH />
              </button>
            )}
            
            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
                {onReply && (
                  <button
                    onClick={handleReply}
                    className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <FaReply className="mr-2" />
                    Reply
                  </button>
                )}
                {isOwner && onDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <FaHeart className="mr-2" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-1 text-gray-700 dark:text-gray-300">
          {content}
        </div>
        
        <div className="mt-2 flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 text-sm ${
              isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
            } hover:text-red-500`}
          >
            <FaHeart className={isLiked ? 'fill-current' : ''} />
            <span>{likes.length}</span>
          </button>
          
          {onReply && (
            <button
              onClick={handleReply}
              className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500"
            >
              <FaReply />
              <span>Reply</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comment;
