import { useCallback } from 'react';
import { useBetStore } from '../store';

const useBets = () => {
  const { 
    bets,
    userBets,
    currentBet,
    page,
    hasMore,
    isLoading,
    error,
    fetchBets,
    fetchUserBets,
    createBet,
    updateBet,
    deleteBet,
    rideBet,
    hedgeBet,
    likeBet,
    unlikeBet,
    shareBet,
    clearError
  } = useBetStore();
  
  // Get user bets helper
  const getUserBets = useCallback((userId) => {
    return userBets[userId]?.bets || [];
  }, [userBets]);
  
  // Check if has more user bets
  const hasMoreUserBets = useCallback((userId) => {
    return userBets[userId]?.hasMore || false;
  }, [userBets]);
  
  // Load more user bets
  const loadMoreUserBets = useCallback((userId) => {
    if (userBets[userId] && !isLoading && userBets[userId].hasMore) {
      fetchUserBets(userId);
    }
  }, [userBets, isLoading, fetchUserBets]);
  
  // Toggle like
  const toggleLike = useCallback((betId, isLiked) => {
    if (isLiked) {
      return unlikeBet(betId);
    } else {
      return likeBet(betId);
    }
  }, [likeBet, unlikeBet]);
    return {
    bets,
    getUserBets,
    currentBet,
    page,
    hasMore,
    hasMoreUserBets,
    isLoading,
    error,
    fetchBets,
    fetchUserBets,
    loadMoreUserBets,
    createBet,
    updateBet,
    deleteBet,
    rideBet,
    hedgeBet,
    toggleLike,
    shareBet,
    clearError
  };
};

export default useBets;
