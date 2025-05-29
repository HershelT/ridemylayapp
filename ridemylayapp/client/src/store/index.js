import useAuthStore from './authStore';
import useBetStore from './betStore';
import useCommentStore from './commentStore';

// Export all stores
export {
  useAuthStore,
  useBetStore,
  useCommentStore
};

// Combine reset function for all stores
export const resetAllStores = () => {
  useAuthStore.getState().logout();
  useBetStore.getState().resetState();
};

// You can add more combined actions here as needed
