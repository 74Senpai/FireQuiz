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

    try {
      const data = await authService.getProfile();

      setState({
        user: {
          full_name: data.fullName,
          email: data.email,
          role: data.role,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      return data;
    } catch (error) {
      localStorage.removeItem("accessToken");
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },

  logout() {
    localStorage.removeItem("accessToken");
    setState({ user: null, isAuthenticated: false, isLoading: false });
  },
};

export const useAuthStore = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    ...snapshot,
    ...actions,
  };
};
