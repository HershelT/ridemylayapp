import { useEffect } from 'react';
import { useAuthStore } from '../store';
import { disconnectSocket, initializeSocket } from '../services/socket';

const useAuth = () => {
  const { 
    user, 
    token, 
    isAuthenticated, 
    isLoading, 
    error,
    login,
    register,
    logout,
    loadUser,
    updateProfile,
    clearError
  } = useAuthStore();
  
  useEffect(() => {
    // Load the user on initial mount if token exists
    if (token && !user && !isLoading) {
      loadUser();
    }
  }, [token, user, isLoading, loadUser]);
  
  useEffect(() => {
    // Initialize socket connection when authenticated
    if (isAuthenticated && token) {
      initializeSocket();
    }
    
    // Cleanup socket on unmount or logout
    return () => {
      if (!isAuthenticated) {
        disconnectSocket();
      }
    };
  }, [isAuthenticated, token]);
  
  const handleLogout = () => {
    disconnectSocket();
    logout();
  };
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout: handleLogout,
    updateProfile,
    clearError
  };
};

export { useAuth };
export default useAuth;
