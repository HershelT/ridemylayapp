import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaEllipsisH, FaHeart, FaReply } from 'react-icons/fa';

const Comment = ({ comment, onLike, onReply, onDelete, currentUserId }) => {
  const { _id, user, content, createdAt, likes } = comment;
  const isLiked = likes?.includes(currentUserId);
  const isOwner = user._id === currentUserId;
  
  const [showOptions, setShowOptions] = React.useState(false);
  
  return (
    <div className="flex space-x-3 py-3 border-b border-gray-700/20">
      <div className="flex-shrink-0">
        <Link to={`/profile/${user._id}`}>
          <img 
            src={user.profilePicture || 'https://via.placeholder.com/40'} 
            alt={user.username}
            className="h-9 w-9 rounded-full object-cover" 
          />
        </Link>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <Link 
              to={`/profile/${user._id}`}
              className="font-medium text-gray-900 dark:text-white hover:underline"
            >
              {user.name}
            </Link>
            <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
              @{user.username}
            </span>
            <span className="mx-1 text-gray-500 dark:text-gray-400">·</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            >
              <FaEllipsisH />
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                <div 
                  className="py-1" 
                  role="menu" 
                  aria-orientation="vertical"
                >
                  <button
                    onClick={() => {
                      onReply(comment);
                      setShowOptions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    Reply
                  </button>
                  
                  {isOwner && (
                    <button
                      onClick={() => {
                        onDelete(_id);
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-gray-800 dark:text-gray-200 mt-1">
          {content}
        </p>
        
        <div className="flex items-center mt-2 space-x-4">
          <button 
            onClick={() => onLike(_id)}
            className={`flex items-center space-x-1 text-sm ${
              isLiked 
                ? 'text-red-500 dark:text-red-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
            }`}
          >
            <FaHeart className={`${isLiked ? 'fill-current' : 'stroke-current'}`} />
            <span>{likes?.length || 0}</span>
          </button>
          
          <button 
            onClick={() => onReply(comment)}
            className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
          >
            <FaReply />
            <span>Reply</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Comment;
