import { create } from 'zustand';
import { betAPI, userAPI } from '../services/api';
import { emitBetInteraction } from '../services/socket';

const useBetStore = create((set, get) => ({
  bets: [],
  userBets: {},  // Keyed by userId
  currentBet: null,
  page: 1,
  hasMore: true,
  isLoading: false,
  error: null,
  
  // Reset state
  resetState: () => set({
    bets: [],
    userBets: {},
    currentBet: null,
    page: 1,
    hasMore: true,
    isLoading: false,
    error: null
  }),
    // Get all bets (feed)
  fetchBets: async (filters = {}, reset = false) => {
    if (reset) {
      set({ bets: [], page: 1, hasMore: true });
    }
    
    const { page, bets, isLoading } = get();
    
    // Don't fetch if already loading or no more bets
    if (isLoading || (!reset && !get().hasMore)) return;
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await betAPI.getAllBets(page, 10, filters);
      const newBets = response.data.bets;
      const hasMore = page < response.data.pages;
      
      set({
        bets: reset ? newBets : [...bets, ...newBets],
        page: page + 1,
        hasMore,
        isLoading: false
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch bets'
      });
    }
  },
  
  // Get user's bets
  fetchUserBets: async (username, filters = {}, reset = false) => {
    if (!username) return;
    
    if (reset) {
      set(state => ({
        userBets: {
          ...state.userBets,
          [username]: { bets: [], page: 1, hasMore: true }
        }
      }));
    }
    
    const userBetState = get().userBets[username] || { bets: [], page: 1, hasMore: true };
    
    // Don't fetch if already loading or no more bets
    if (get().isLoading || (!reset && !userBetState.hasMore)) return;
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await userAPI.getUserBets(username, userBetState.page, 10, filters);
      const newBets = response.data.bets;
      const hasMore = userBetState.page < response.data.pages;
      
      set(state => ({
        userBets: {
          ...state.userBets,
          [username]: {
            bets: reset ? newBets : [...(userBetState.bets || []), ...newBets],
            page: userBetState.page + 1,
            hasMore
          }
        },
        isLoading: false
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch user bets'
      });
    }
  },
  // Create a new bet
  createBet: async (betData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await betAPI.createBet(betData);
      const newBet = response.data.bet;
      
      // Add to bets list
      set(state => ({
        bets: [newBet, ...state.bets],
        isLoading: false
      }));
      
      return newBet;
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to create bet'
      });
      throw error;
    }
  },
  
  
  // Get single bet
  fetchBet: async (betId) => {
    if (!betId) return null;
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await betAPI.getBet(betId);
      const bet = response.data.bet;
      
      set({
        currentBet: bet,
        isLoading: false
      });
      
      return bet;
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch bet'
      });
      return null;
    }
  },
  
  // Update bet status
  updateBetStatus: async (betId, statusData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await betAPI.updateBetStatus(betId, statusData);
      const updatedBet = response.data.bet;
      
      // Update in bets list
      set(state => ({
        bets: state.bets.map(bet => 
          bet._id === betId ? updatedBet : bet
        ),
        currentBet: state.currentBet?._id === betId ? updatedBet : state.currentBet,
        isLoading: false
      }));
      
      // Update in user bets
      const { userBets } = get();
      Object.keys(userBets).forEach(username => {
        if (userBets[username].bets.some(bet => bet._id === betId)) {
          set(state => ({
            userBets: {
              ...state.userBets,
              [username]: {
                ...state.userBets[username],
                bets: state.userBets[username].bets.map(bet => 
                  bet._id === betId ? updatedBet : bet
                )
              }
            }
          }));
        }
      });
      
      return updatedBet;
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update bet status'
      });
      throw error;
    }
  },

  // Update an existing bet
  updateBet: async (betId, betData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await betAPI.updateBet(betId, betData);
      const updatedBet = response.data;
      
      // Update the bet in both bets array and userBets if present
      set(state => {
        const updatedBets = state.bets.map(bet => 
          bet._id === betId ? updatedBet : bet
        );
        
        const updatedUserBets = { ...state.userBets };
        
        // Update in user bets if present
        Object.keys(updatedUserBets).forEach(userId => {
          if (updatedUserBets[userId].bets) {
            updatedUserBets[userId].bets = updatedUserBets[userId].bets.map(bet => 
              bet._id === betId ? updatedBet : bet
            );
          }
        });
        
        return {
          bets: updatedBets,
          userBets: updatedUserBets,
          currentBet: state.currentBet?._id === betId ? updatedBet : state.currentBet,
          isLoading: false
        };
      });
      
      return { success: true, bet: updatedBet };
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update bet'
      });
      
      return { success: false, error: error.response?.data?.message || 'Failed to update bet' };
    }
  },
  
  // Ride a bet (copy & repost)
  rideBet: async (betId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await betAPI.rideBet(betId);
      const newBet = response.data;
      
      // Update bets array with the new bet at the beginning
      set(state => ({
        bets: [newBet, ...state.bets],
        isLoading: false
      }));
      
      return { success: true, bet: newBet };
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to ride bet'
      });
      
      return { success: false, error: error.response?.data?.message || 'Failed to ride bet' };
    }
  },
  
  // Hedge a bet (flip & repost)
  hedgeBet: async (betId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await betAPI.hedgeBet(betId);
      const newBet = response.data;
      
      // Update bets array with the new bet at the beginning
      set(state => ({
        bets: [newBet, ...state.bets],
        isLoading: false
      }));
      
      return { success: true, bet: newBet };
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to hedge bet'
      });
      
      return { success: false, error: error.response?.data?.message || 'Failed to hedge bet' };
    }
  },
  
  // Like a bet
  likeBet: async (betId) => {
    try {
      // Optimistic update
      set(state => {
        const updatedBets = state.bets.map(bet => 
          bet._id === betId 
            ? { ...bet, liked: true, likes: [...(bet.likes || []), 'current-user-placeholder'] } 
            : bet
        );
        
        const updatedUserBets = { ...state.userBets };
        
        // Update in user bets if present
        Object.keys(updatedUserBets).forEach(userId => {
          if (updatedUserBets[userId].bets) {
            updatedUserBets[userId].bets = updatedUserBets[userId].bets.map(bet => 
              bet._id === betId 
                ? { ...bet, liked: true, likes: [...(bet.likes || []), 'current-user-placeholder'] } 
                : bet
            );
          }
        });
        
        return {
          bets: updatedBets,
          userBets: updatedUserBets,
          currentBet: state.currentBet?._id === betId 
            ? { ...state.currentBet, liked: true, likes: [...(state.currentBet.likes || []), 'current-user-placeholder'] } 
            : state.currentBet
        };
      });
      
      // Make API call
      await betAPI.likeBet(betId);
      
      // Emit socket event
      emitBetInteraction('like', betId);
      
      return { success: true };
    } catch (error) {
      // Revert optimistic update on error
      set(state => {
        const updatedBets = state.bets.map(bet => 
          bet._id === betId 
            ? { ...bet, liked: false, likes: (bet.likes || []).filter(id => id !== 'current-user-placeholder') } 
            : bet
        );
        
        const updatedUserBets = { ...state.userBets };
        
        Object.keys(updatedUserBets).forEach(userId => {
          if (updatedUserBets[userId].bets) {
            updatedUserBets[userId].bets = updatedUserBets[userId].bets.map(bet => 
              bet._id === betId 
                ? { ...bet, liked: false, likes: (bet.likes || []).filter(id => id !== 'current-user-placeholder') } 
                : bet
            );
          }
        });
        
        return {
          bets: updatedBets,
          userBets: updatedUserBets,
          currentBet: state.currentBet?._id === betId 
            ? { ...state.currentBet, liked: false, likes: (state.currentBet.likes || []).filter(id => id !== 'current-user-placeholder') } 
            : state.currentBet,
          error: error.response?.data?.message || 'Failed to like bet'
        };
      });
      
      return { success: false, error: error.response?.data?.message || 'Failed to like bet' };
    }
  },
  
  // Unlike a bet
  unlikeBet: async (betId) => {
    try {
      // Optimistic update
      set(state => {
        const updatedBets = state.bets.map(bet => 
          bet._id === betId 
            ? { ...bet, liked: false, likes: (bet.likes || []).filter(id => id !== 'current-user-placeholder') } 
            : bet
        );
        
        const updatedUserBets = { ...state.userBets };
        
        Object.keys(updatedUserBets).forEach(userId => {
          if (updatedUserBets[userId].bets) {
            updatedUserBets[userId].bets = updatedUserBets[userId].bets.map(bet => 
              bet._id === betId 
                ? { ...bet, liked: false, likes: (bet.likes || []).filter(id => id !== 'current-user-placeholder') } 
                : bet
            );
          }
        });
        
        return {
          bets: updatedBets,
          userBets: updatedUserBets,
          currentBet: state.currentBet?._id === betId 
            ? { ...state.currentBet, liked: false, likes: (state.currentBet.likes || []).filter(id => id !== 'current-user-placeholder') } 
            : state.currentBet
        };
      });
      
      // Make API call
      await betAPI.unlikeBet(betId);
      
      // Emit socket event
      emitBetInteraction('unlike', betId);
      
      return { success: true };
    } catch (error) {
      // Revert optimistic update on error
      set(state => {
        const updatedBets = state.bets.map(bet => 
          bet._id === betId 
            ? { ...bet, liked: true, likes: [...(bet.likes || []), 'current-user-placeholder'] } 
            : bet
        );
        
        const updatedUserBets = { ...state.userBets };
        
        Object.keys(updatedUserBets).forEach(userId => {
          if (updatedUserBets[userId].bets) {
            updatedUserBets[userId].bets = updatedUserBets[userId].bets.map(bet => 
              bet._id === betId 
                ? { ...bet, liked: true, likes: [...(bet.likes || []), 'current-user-placeholder'] } 
                : bet
            );
          }
        });
        
        return {
          bets: updatedBets,
          userBets: updatedUserBets,
          currentBet: state.currentBet?._id === betId 
            ? { ...state.currentBet, liked: true, likes: [...(state.currentBet.likes || []), 'current-user-placeholder'] } 
            : state.currentBet,
          error: error.response?.data?.message || 'Failed to unlike bet'
        };
      });
      
      return { success: false, error: error.response?.data?.message || 'Failed to unlike bet' };
    }
  },
  
  // Share a bet
  shareBet: async (betId) => {
    try {
      // Optimistic update
      set(state => {
        const updatedBets = state.bets.map(bet => 
          bet._id === betId 
            ? { ...bet, shares: (bet.shares || 0) + 1 } 
            : bet
        );
        
        const updatedUserBets = { ...state.userBets };
        
        Object.keys(updatedUserBets).forEach(userId => {
          if (updatedUserBets[userId].bets) {
            updatedUserBets[userId].bets = updatedUserBets[userId].bets.map(bet => 
              bet._id === betId 
                ? { ...bet, shares: (bet.shares || 0) + 1 } 
                : bet
            );
          }
        });
        
        return {
          bets: updatedBets,
          userBets: updatedUserBets,
          currentBet: state.currentBet?._id === betId 
            ? { ...state.currentBet, shares: (state.currentBet.shares || 0) + 1 } 
            : state.currentBet
        };
      });
      
      // Make API call
      const response = await betAPI.shareBet(betId);
      
      return { success: true, shareUrl: response.data.shareUrl };
    } catch (error) {
      // Revert optimistic update on error
      set(state => {
        const updatedBets = state.bets.map(bet => 
          bet._id === betId 
            ? { ...bet, shares: Math.max(0, (bet.shares || 0) - 1) } 
            : bet
        );
        
        const updatedUserBets = { ...state.userBets };
        
        Object.keys(updatedUserBets).forEach(userId => {
          if (updatedUserBets[userId].bets) {
            updatedUserBets[userId].bets = updatedUserBets[userId].bets.map(bet => 
              bet._id === betId 
                ? { ...bet, shares: Math.max(0, (bet.shares || 0) - 1) } 
                : bet
            );
          }
        });
        
        return {
          bets: updatedBets,
          userBets: updatedUserBets,
          currentBet: state.currentBet?._id === betId 
            ? { ...state.currentBet, shares: Math.max(0, (state.currentBet.shares || 0) - 1) } 
            : state.currentBet,
          error: error.response?.data?.message || 'Failed to share bet'
        };
      });
      
      return { success: false, error: error.response?.data?.message || 'Failed to share bet' };
    }
  },
  
  // Clear errors
  clearError: () => set({ error: null })
}));

export default useBetStore;
