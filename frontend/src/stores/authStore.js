import { useSyncExternalStore } from "react";
import * as authService from "../services/authServices";

let state = {
  user: null,
  isAuthenticated: Boolean(localStorage.getItem("accessToken")),
  isLoading: false,
};

const listeners = new Set();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const setState = (partialState) => {
  state = { ...state, ...partialState };
  emitChange();
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;

const actions = {
  async login(data) {
    const res = await authService.login(data);

    localStorage.setItem("accessToken", res.accessToken);
    setState({
      user: res.user ?? null,
      isAuthenticated: true,
      isLoading: false,
    });

    return res;
  },

  async fetchUser() {
    setState({ isLoading: true });

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
