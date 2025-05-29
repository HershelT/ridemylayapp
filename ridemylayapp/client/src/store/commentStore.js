import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { commentAPI } from '../services/api';
import useAuthStore from './authStore';

const useCommentStore = create(
  devtools((set, get) => ({
    comments: {},  // Organized by betId: { [betId]: [comments] }
    loading: false,
    error: null,
    
    // Reset store state
    resetState: () => {
      set({
        comments: {},
        loading: false,
        error: null
      });
    },    // Get comments for a bet
    getComments: async (betId) => {
      set((state) => ({
        loading: true,
        error: null,
      }));      
      
      try {
        const response = await commentAPI.getComments(betId);
        const serverComments = response.data.comments || [];
        
        console.log("Received comments from server:", serverComments);
          // Map server comments to handle MongoDB extended JSON format
        const mappedComments = serverComments.map(comment => {
          const userId = comment.userId?._id || comment.userId?.$oid || comment.userId;
          const user = comment.userId?.username ? comment.userId : comment.user;
          
          // Handle replyToUserId correctly if it's populated
          const replyToUser = comment.replyToUserId?.username 
            ? comment.replyToUserId 
            : null;
            
          return {
            _id: comment._id?.$oid || comment._id,
            content: comment.content,
            userId: userId,
            betId: comment.betId?.$oid || comment.betId,
            parentId: comment.parentId?.$oid || comment.parentId || null,
            replyToUsername: comment.replyToUsername || null,
            replyToUserId: comment.replyToUserId?.$oid || comment.replyToUserId?._id || comment.replyToUserId || null,
            likes: comment.likes?.map(like => like.$oid || like) || [],
            createdAt: comment.createdAt?.$date?.$numberLong 
              ? new Date(parseInt(comment.createdAt.$date.$numberLong)).toISOString()
              : comment.createdAt,
            updatedAt: comment.updatedAt?.$date?.$numberLong
              ? new Date(parseInt(comment.updatedAt.$date.$numberLong)).toISOString()
              : comment.updatedAt,
            isEdited: comment.isEdited || false,
            // Include populated user data
            user: {
              _id: user?._id || userId,
              username: user?.username || "Anonymous",
              avatarUrl: user?.avatarUrl || "",
              verified: user?.verified || false
            }
          };
        });
        
        console.log("Mapped comments:", mappedComments);
        
        set((state) => {
          return {
            comments: {
              ...state.comments,
              [betId]: mappedComments,
            },
            loading: false,
          };
        });
        
        return mappedComments;
      } catch (error) {
        console.error("Error fetching comments:", error);
        set({
          loading: false,
          error: error.response?.data?.message || 'Failed to fetch comments',
        });
        return [];
      }
    },    // Add a new comment        
    addComment: async (betId, content, parentId = null, replyToUsername = null, replyToUserId = null) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        throw new Error('User must be logged in to comment');
      }

      // Create unique ID for temporary comment
      const tempId = Date.now().toString();        
      // Create temporary comment object that matches server format exactly
      const tempComment = {
        _id: tempId,
        content,
        betId,
        userId: currentUser._id,
        createdAt: new Date().toISOString(),
        likes: [],
        parentId: parentId || null,  // Ensure null for top-level comments
        replyToUsername,
        replyToUserId,
        isTemp: true,
        user: {  // Include populated user data in the same format as server
          _id: currentUser._id,
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl || '',  // Handle missing avatar gracefully
          verified: currentUser.verified || false  // Default to false if not set
        }
      };
      
      set((state) => ({
        comments: {
          ...state.comments,
          [betId]: state.comments[betId] 
            ? [tempComment, ...state.comments[betId]]
            : [tempComment],
        },
      }));        try {      
        // Make the actual API call
        console.log("Sending comment to server:", { content, parentId, replyToUsername, replyToUserId });
        const response = await commentAPI.addComment(betId, { 
          content, 
          parentId,
          replyToUsername,
          replyToUserId
        });
        console.log("Server response:", response.data);
        
        const serverComment = response.data.comment;        // Transform the server response to match our format
        const userId = serverComment.userId?._id || serverComment.userId?.$oid || serverComment.userId;
        const user = serverComment.userId?.username ? serverComment.userId : serverComment.user;
        
        // Get populated replyToUser if available
        const replyToUser = serverComment.replyToUserId?.username 
          ? serverComment.replyToUserId 
          : null;
          
        const newComment = {
          _id: serverComment._id?.$oid || serverComment._id,
          content: serverComment.content,
          userId: userId,
          betId: serverComment.betId?.$oid || serverComment.betId,
          likes: serverComment.likes?.map(like => like.$oid || like) || [],
          parentId: serverComment.parentId || null,
          replyToUsername: serverComment.replyToUsername || null,
          replyToUserId: serverComment.replyToUserId?.$oid || serverComment.replyToUserId?._id || serverComment.replyToUserId || null,
          createdAt: serverComment.createdAt?.$date?.$numberLong 
            ? new Date(parseInt(serverComment.createdAt.$date.$numberLong)).toISOString()
            : serverComment.createdAt,
          updatedAt: serverComment.updatedAt?.$date?.$numberLong
            ? new Date(parseInt(serverComment.updatedAt.$date.$numberLong)).toISOString()
            : serverComment.updatedAt,
          isEdited: serverComment.isEdited || false,
          // Include populated user data with fallbacks
          user: {
            _id: user?._id || userId,
            username: user?.username || currentUser.username,
            avatarUrl: user?.avatarUrl || currentUser.avatarUrl || '',
            verified: user?.verified || currentUser.verified || false
          }
        };
        
        console.log("Transformed comment:", newComment);
        
        set((state) => {
          const existingComments = state.comments[betId] || [];
          const otherComments = existingComments.filter(comment => comment._id !== tempId);
          
          return {
            comments: {
              ...state.comments,
              [betId]: [newComment, ...otherComments],
            },
          };
        });
        
        return newComment;
      } catch (error) {
        // Remove the temporary comment on error
        set((state) => ({
          comments: {
            ...state.comments,
            [betId]: state.comments[betId].filter(comment => comment._id !== tempId),
          },
          error: error.response?.data?.message || 'Failed to add comment',
        }));
        throw error;
      }
    },    // Like a comment
    likeComment: async (commentId) => {
      try {
        const response = await commentAPI.likeComment(commentId);
        const serverComment = response.data.comment;
        
        // Transform the server response to match our format
        const userId = serverComment.userId?._id || serverComment.userId?.$oid || serverComment.userId;
        const user = serverComment.userId?.username ? serverComment.userId : serverComment.user;
        
        const updatedComment = {
          _id: serverComment._id?.$oid || serverComment._id,
          content: serverComment.content,
          userId: userId,
          betId: serverComment.betId?.$oid || serverComment.betId,
          likes: serverComment.likes?.map(like => like.$oid || like) || [],
          createdAt: serverComment.createdAt?.$date?.$numberLong 
            ? new Date(parseInt(serverComment.createdAt.$date.$numberLong)).toISOString()
            : serverComment.createdAt,
          updatedAt: serverComment.updatedAt?.$date?.$numberLong
            ? new Date(parseInt(serverComment.updatedAt.$date.$numberLong)).toISOString()
            : serverComment.updatedAt,
          isEdited: serverComment.isEdited || false,
          // Include populated user data
          user: {
            _id: user?._id || userId,
            username: user?.username || "Anonymous",
            avatarUrl: user?.avatarUrl || "",
            verified: user?.verified || false
          }
        };
        
        // Update the comment in all bets where it appears
        set((state) => {
          const newComments = { ...state.comments };
          
          // Find which bet contains this comment
          Object.keys(newComments).forEach((betId) => {
            newComments[betId] = newComments[betId].map((comment) => 
              comment._id === commentId ? updatedComment : comment
            );
          });
          
          return { comments: newComments };
        });
        
        return updatedComment;
      } catch (error) {
        set({
          error: error.response?.data?.message || 'Failed to like comment',
        });
        throw error;
      }
    },

    // Delete a comment
    deleteComment: async (commentId) => {
      try {
        await commentAPI.deleteComment(commentId);
        
        // Remove the comment from all bets
        set((state) => {
          const newComments = { ...state.comments };
          
          // Find which bet contains this comment and remove it
          Object.keys(newComments).forEach((betId) => {
            newComments[betId] = newComments[betId].filter(
              (comment) => comment._id !== commentId
            );
          });
          
          return { comments: newComments };
        });
        
        return true;
      } catch (error) {
        set({
          error: error.response?.data?.message || 'Failed to delete comment',
        });
        throw error;
      }
    },

    // Clear comment errors
    clearErrors: () => set({ error: null }),
  }))
);

export default useCommentStore;
