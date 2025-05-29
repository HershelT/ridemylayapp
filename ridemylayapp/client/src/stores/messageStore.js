import create from 'zustand';
import { chatAPI } from '../services/chatApi';

const useMessageStore = create((set, get) => ({
  unreadCount: 0,
  loading: false,
  error: null,

  fetchUnreadCount: async () => {
    try {
      const { count } = await chatAPI.getUnreadMessageCount();
      set({ unreadCount: count });
    } catch (error) {
      set({ error: error.message });
    }
  },

  incrementUnreadCount: () => {
    set(state => ({ unreadCount: state.unreadCount + 1 }));
  },

  resetUnreadCount: () => {
    set({ unreadCount: 0 });
  },

  // This can be called when a specific chat is read
  decrementUnreadCount: (amount = 1) => {
    set(state => ({ 
      unreadCount: Math.max(0, state.unreadCount - amount) 
    }));
  }
}));

export default useMessageStore;
