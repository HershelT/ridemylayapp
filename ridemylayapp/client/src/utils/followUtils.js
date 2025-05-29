import useAuthStore from '../store/authStore';

/**
 * Checks if the current user is following a specific user
 * @param {string} userId - The ID of the user to check
 * @returns {boolean} - Whether the current user is following the specified user
 */
export const isCurrentUserFollowing = (userId) => {
  if (!userId) return false;
  return useAuthStore.getState().isFollowingUser(userId);
};

/**
 * Ensures follow status consistency across components
 * @param {Object} user - The user object to check
 * @returns {Object} - The user object with consistent isFollowing property
 */
export const ensureFollowStatus = (user) => {
  if (!user) return null;
  
  // Get the current state directly from the store
  const isFollowingFromStore = useAuthStore.getState().isFollowingUser(user._id);
  
  // If there's a mismatch, use the store value as source of truth
  if (user.isFollowing !== undefined && user.isFollowing !== isFollowingFromStore) {
    return {
      ...user,
      isFollowing: isFollowingFromStore
    };
  }
  
  // If isFollowing is not defined, add it from the store
  if (user.isFollowing === undefined) {
    return {
      ...user,
      isFollowing: isFollowingFromStore
    };
  }
  
  // No changes needed
  return user;
};
