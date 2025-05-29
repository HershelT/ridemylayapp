import { useEffect } from 'react';
import { useAuthStore } from '../store';
import socketService from '../services/socket';

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
  
  useEffect(() => {    // Initialize socket connection when authenticated
    if (isAuthenticated && token) {
      socketService.createSocket();
    }
    
    // Cleanup socket on unmount or logout
    return () => {
      if (!isAuthenticated) {
        socketService.disconnectSocket();
      }
    };
  }, [isAuthenticated, token]);
    const handleLogout = () => {
    socketService.disconnectSocket();
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
