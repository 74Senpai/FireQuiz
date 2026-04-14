import { create } from "zustand";
import * as authService from "../services/authServices.js";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (data) => {
    try {
      const res = await authService.login(data);
      
      if (res && res.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
        set({
          user: res.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return res;
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error; 
    }
  },

  fetchUser: async () => {
    try {
      const data = await authService.getProfile();
      set({
        user: {
          id: data.id,
          full_name: data.fullName,
          email: data.email,
          role: data.role,
          avatar_url: data.avatar_url,
          bio: data.bio
        },
        isAuthenticated: true,
        isLoading: false,
      });
      return data;
    } catch (error) {
      localStorage.removeItem("accessToken");
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("accessToken");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  initAuth: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }
    try {
      const data = await authService.getProfile();
      set({
        user: {
          id: data.id,
          full_name: data.fullName,
          email: data.email,
          role: data.role,
          avatar_url: data.avatar_url,
          bio: data.bio
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem("accessToken");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null
    }));
  }
}));

