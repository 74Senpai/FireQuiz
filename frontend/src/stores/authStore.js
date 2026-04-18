import { create } from "zustand";
import * as authService from "../services/authServices.js";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Helper to normalize user data across different API responses
  _normalizeUser: (data) => {
    if (!data) return null;
    return {
      ...data,
      // Ensure full_name is always available (maps from fullName if needed)
      full_name: data.full_name || data.fullName || data.full_name,
    };
  },

  login: async (data) => {
    try {
      const res = await authService.login(data);
      
      if (res && res.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
        
        // After getting token, we MUST fetch the full profile to get all details (role, avatar, etc.)
        // This avoids the 'need reload' issue.
        const userStore = useAuthStore.getState();
        const profileData = await authService.getProfile();
        
        set({
          user: userStore._normalizeUser(profileData),
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
      const userStore = useAuthStore.getState();
      set({
        user: userStore._normalizeUser(data),
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
      const userStore = useAuthStore.getState();
      set({
        user: userStore._normalizeUser(data),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem("accessToken");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (newData) => {
    set((state) => ({
      user: { ...state.user, ...newData }
    }));
  },
}));

