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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Send reply information along with the comment
      if (replyTo) {
        await onAddComment(
          betId, 
          newComment, 
          replyTo._id, 
          replyTo.user?.username, 
          replyTo.user?._id
        );
      } else {
        await onAddComment(betId, newComment);
      }
      
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to submit comment:', error);
      // Error handling will be done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };
    const handleReply = (comment) => {
    // Ensure the comment has a valid user object before setting as replyTo
    if (comment && comment.content) {
      // Make sure user property is always defined with at least an empty object
      const safeComment = {
        ...comment,
        user: comment.user || { username: 'Anonymous' }
      };
      setReplyTo(safeComment);
      // Focus the comment input field
      document.getElementById('comment-input')?.focus();
    }
  };
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>
      
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">          {replyTo && (
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs px-3 py-1 rounded-t-md border-t border-x border-blue-200 dark:border-blue-800">
              Replying to <span className="font-semibold">@{replyTo.user?.username || 'Anonymous'}</span>
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
            id="comment-input"            placeholder={isSubmitting ? "Posting comment..." : "Add a comment..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
            className={`w-full border border-gray-300 dark:border-gray-700 ${
              replyTo ? 'rounded-b-lg rounded-t-none' : 'rounded-lg'
            } px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white disabled:opacity-75 disabled:cursor-not-allowed`}
            rows="2"
          />
            <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className={`absolute bottom-2 right-2 ${
              isSubmitting 
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </div>
      </form>
        {/* Comments list */}
      {loading ? (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto mb-2"></div>
          Loading comments...
        </div>      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {/* Filter for top-level comments only - those without a parentId */}
          {[...comments].filter(comment => !comment.parentId).map((comment) => (
            <div key={comment._id} className="comment-thread">
              <Comment
                comment={comment}
                currentUserId={currentUserId}
                onLike={onLikeComment}
                onReply={handleReply}
                onDelete={onDeleteComment}
              />
              
              {/* Display replies to this comment */}
              {comments.filter(reply => reply.parentId === comment._id).length > 0 && (
                <div className="ml-8 mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
                  {comments
                    .filter(reply => reply.parentId === comment._id)
                    .map(reply => (
                      <Comment
                        key={reply._id}
                        comment={reply}
                        currentUserId={currentUserId}
                        onLike={onLikeComment}
                        onReply={handleReply}
                        onDelete={onDeleteComment}
                      />
                    ))
                  }
                </div>
              )}
            </div>
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
