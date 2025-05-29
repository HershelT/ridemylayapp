import { create } from 'zustand';
import { authAPI, userAPI } from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  
  // Login
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to login. Please try again.'
      });
      
      return { success: false, error: error.response?.data?.message || 'Failed to login' };
    }
  },
  
  // Register
  register: async (userData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      });
      
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('token');
    
    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  },
    // Load current user
  loadUser: async () => {
    if (!localStorage.getItem('token')) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    
    set({ isLoading: true });
    
    try {
      const response = await authAPI.getCurrentUser();
      
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      localStorage.removeItem('token');
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to load user'
      });
    }
  },
    // Update user profile
  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authAPI.updateProfile(profileData);
      
      set({
        user: response.data.user,
        isLoading: false,
        error: null
      });
      
      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update profile'
      });
      
      return { success: false, error: error.response?.data?.message || 'Failed to update profile' };
    }
  },  
  // Clear errors
  clearError: () => set({ error: null }),
    // Track followed users  
    followUser: async (username) => {
    try {
      const response = await userAPI.toggleFollow(username);
      const { isFollowing, userId } = response.data;
      
      set(state => {
        if (!state.user) return state;
        
        // Normalize the following array to ensure we're working with strings
        const following = (state.user.following || []).map(id => 
          typeof id === 'object' ? id._id || id.toString() : id.toString()
        );
        
        // Create a new following list based on the server response
        const newFollowing = isFollowing
          ? [...new Set([...following, userId.toString()])]
          : following.filter(id => id !== userId.toString());
        
        return {
          user: {
            ...state.user,
            following: newFollowing
          }
        };
      });
      
      return { success: true, isFollowing, userId };
    } catch (error) {
      console.error('Error following user:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update follow status' 
      };
    }
  },
  
  // Check if the current user is following a specific user
  isFollowingUser: (userId) => {
    const state = useAuthStore.getState();
    if (!state.user || !state.user.following) return false;
    return state.user.following.some(id => 
      id === userId || id._id === userId || (typeof id === 'object' && id.toString() === userId)
    );
  }
}));

export default useAuthStore;
