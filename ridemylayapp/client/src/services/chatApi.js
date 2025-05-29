import api from './apiConfig';

export const chatAPI = {
  getUserChats: () => api.get('/chats'),
  searchUsers: (query) => api.get(`/chats/users/search?query=${encodeURIComponent(query)}`),
  accessChat: (userId) => api.post('/chats', { userId }),
  createGroupChat: (data) => api.post('/chats/group', data),
  updateGroupChat: (chatId, data) => api.put(`/chats/group/${chatId}`, data),
  addToGroup: (chatId, userId) => api.put(`/chats/group/${chatId}/add`, { userId }),
  removeFromGroup: (chatId, userId) => api.put(`/chats/group/${chatId}/remove`, { userId }),
  getUnreadMessageCount: () => api.get('/chats/unread-count'),
};

export const messageAPI = {
  getMessages: (chatId) => api.get(`/messages/${chatId}`),
  sendMessage: (data) => api.post('/messages', data),
  updateMessage: (messageId, content) => api.put(`/messages/${messageId}`, { content }),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  markAsRead: (chatId) => api.put(`/messages/read/${chatId}`),
};
