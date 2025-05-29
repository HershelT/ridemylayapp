import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { commentAPI } from '../services/api';

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
    },

    // Get comments for a bet
    getComments: async (betId) => {
      set((state) => ({
        loading: true,
        error: null,
      }));

      try {
        const response = await commentAPI.getComments(betId);
        
        set((state) => ({
          comments: {
            ...state.comments,
            [betId]: response.data.comments,
          },
          loading: false,
        }));
        
        return response.data.comments;
      } catch (error) {
        set({
          loading: false,
          error: error.response?.data?.message || 'Failed to fetch comments',
        });
        return [];
      }
    },    // Add a new comment    
    addComment: async (betId, content, parentId = null) => {
      // Optimistic update with temporary comment
      const tempId = Date.now().toString();
      const tempComment = {
        _id: tempId,
        content,
        userId: get().currentUser,
        createdAt: new Date().toISOString(),
        likes: [],
        parentId,
        isTemp: true
      };
      
      set((state) => ({
        comments: {
          ...state.comments,
          [betId]: state.comments[betId] 
            ? [tempComment, ...state.comments[betId]]
            : [tempComment],
        },
      }));

      try {
        // Make the actual API call
        const response = await commentAPI.addComment(betId, content, parentId);
        const newComment = response.data.comment;
        
        // Replace the temporary comment with the real one
        set((state) => ({
          comments: {
            ...state.comments,
            [betId]: state.comments[betId].map(comment => 
              comment._id === tempId ? newComment : comment
            ),
          },
        }));
        
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
    },

    // Like a comment
    likeComment: async (commentId) => {
      try {
        const response = await commentAPI.likeComment(commentId);
        const updatedComment = response.data.comment;
        
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
