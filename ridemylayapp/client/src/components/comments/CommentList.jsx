import React, { useState } from 'react';
import Comment from './Comment';
import { FaPaperPlane } from 'react-icons/fa';

const CommentList = ({ 
  betId, 
  comments = [], 
  currentUserId, 
  onAddComment, 
  onLikeComment, 
  onDeleteComment,
  loading = false
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    onAddComment(betId, newComment, replyTo?._id);
    setNewComment('');
    setReplyTo(null);
  };
  
  const handleReply = (comment) => {
    setReplyTo(comment);
    // Focus the comment input field
    document.getElementById('comment-input').focus();
  };
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>
      
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          {replyTo && (
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs px-3 py-1 rounded-t-md border-t border-x border-blue-200 dark:border-blue-800">
              Replying to <span className="font-semibold">@{replyTo.user.username}</span>
              <button 
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
              >
                ×
              </button>
            </div>
          )}
          
          <textarea
            id="comment-input"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className={`w-full border border-gray-300 dark:border-gray-700 ${
              replyTo ? 'rounded-b-lg rounded-t-none' : 'rounded-lg'
            } px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white`}
            rows="2"
          />
          
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute bottom-2 right-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
      
      {/* Comments list */}
      {loading ? (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          Loading comments...
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-1">
          {comments.map((comment) => (
            <Comment
              key={comment._id}
              comment={comment}
              currentUserId={currentUserId}
              onLike={onLikeComment}
              onReply={handleReply}
              onDelete={onDeleteComment}
            />
          ))}
        </div>
      ) : (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          No comments yet. Be the first to share your thoughts!
        </div>
      )}
    </div>
  );
};

export default CommentList;
