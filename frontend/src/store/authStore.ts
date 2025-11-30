import { create } from 'zustand';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  is_github_connected: boolean;
  github_username?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  connectGithub: (code: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { access_token, user_id, username, is_github_connected } = response.data;

      localStorage.setItem('access_token', access_token);

      set({
        user: {
          id: user_id,
          username,
          email,
          is_github_connected,
        },
        isAuthenticated: true,
      });
    } catch (error) {
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    try {
      const response = await authAPI.register({ username, email, password });
      const { access_token, user_id, is_github_connected } = response.data;

      localStorage.setItem('access_token', access_token);

      set({
        user: {
          id: user_id,
          username,
          email,
          is_github_connected,
        },
        isAuthenticated: true,
      });
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  fetchUser: async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await authAPI.me();
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('access_token');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  connectGithub: async (code: string) => {
    try {
      await authAPI.connectGithub(code);
      const response = await authAPI.me();
      set({
        user: response.data,
      });
    } catch (error) {
      throw error;
    }
  },

  deleteAccount: async () => {
    try {
      await authAPI.deleteAccount();
      localStorage.removeItem('access_token');
      set({
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      throw error;
    }
  },
}));
