import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // Handle token expiration - 401 Unauthorized
    if (response && response.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login page or show auth modal
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/password', passwordData),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetToken: (token) => api.get(`/auth/reset-password/${token}`),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// User API calls
export const userAPI = {
  getProfile: (username) => api.get(`/users/${username}`),
  getUserBets: (username, page = 1, limit = 10, filters = {}) => 
    api.get(`/users/${username}/bets`, { params: { page, limit, ...filters } }),
  toggleFollow: (username) => api.put(`/users/${username}/follow`),
  getLeaderboard: (timeframe = 'all', page = 1, limit = 10) => 
    api.get('/users/leaderboard', { params: { timeframe, page, limit } }),
};

// Bet API calls
export const betAPI = {
  getAllBets: (page = 1, limit = 10, filters = {}) => 
    api.get('/bets', { params: { page, limit, ...filters } }),  getBet: (betId) => api.get(`/bets/${betId}`),
  createBet: (betData) => api.post('/bets', betData),
  updateBet: (betId, betData) => api.put(`/bets/${betId}`, betData),
  deleteBet: (betId) => api.delete(`/bets/${betId}`),
  updateBetStatus: (betId, statusData) => api.put(`/bets/${betId}/status`, statusData),  toggleLike: (betId) => api.put(`/bets/${betId}/like`),
  getBetComments: (betId, page = 1, limit = 10) => 
    api.get(`/bets/${betId}/comments`, { params: { page, limit } }),
  addComment: (betId, content, parentId) => 
    api.post(`/bets/${betId}/comments`, { content, parentId }),
  toggleRide: (betId) => api.put(`/bets/${betId}/ride`),
  toggleHedge: (betId) => api.put(`/bets/${betId}/hedge`),
  shareBet: (betId, platform) => api.post(`/bets/${betId}/share`, { platform }),
};

// Comment API calls
export const commentAPI = {
  getComments: (betId) => api.get(`/bets/${betId}/comments`),
  addComment: (betId, commentData) => api.post(`/bets/${betId}/comments`, commentData),
  getComment: (commentId) => api.get(`/comments/${commentId}`),
  updateComment: (commentId, content) => api.put(`/comments/${commentId}`, { content }),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  likeComment: (commentId) => api.put(`/comments/${commentId}/like`),
};

// Leaderboard API calls
export const leaderboardAPI = {
  getLeaderboard: (timeframe = 'all', page = 1, limit = 10) => 
    api.get('/users/leaderboard', { params: { timeframe, page, limit } }),
};

// Betting Sites API calls
export const bettingSiteAPI = {
  getBettingSites: (filters = {}) => api.get('/betting-sites', { params: filters }),
  getBettingSite: (siteId) => api.get(`/betting-sites/${siteId}`),
};

// Chat API calls
export const chatAPI = {
  getUserChats: () => api.get('/chats'),
  accessChat: (userId) => api.post('/chats', { userId }),
  createGroupChat: (chatData) => api.post('/chats/group', chatData),
  updateGroupChat: (chatId, chatData) => api.put(`/chats/group/${chatId}`, chatData),
  addToGroup: (chatId, userId) => api.put(`/chats/group/${chatId}/add`, { userId }),
  removeFromGroup: (chatId, userId) => api.put(`/chats/group/${chatId}/remove`, { userId }),
};

// Message API calls
export const messageAPI = {
  getMessages: (chatId, page = 1, limit = 20) => 
    api.get(`/messages/${chatId}`, { params: { page, limit } }),
  sendMessage: (messageData) => api.post('/messages', messageData),
  markAsRead: (chatId) => api.put(`/messages/read/${chatId}`),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

export default api;
