export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (data) => {
    const res = await authService.login(data);

    // lưu token
    localStorage.setItem("accessToken", res.accessToken);

    // set state
    set({
      user: res.user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  fetchUser: async () => {
    try {
      const data = await authService.getMe();

      set({
        user: {
          full_name: data.fullName,
          email: data.email,
          role: data.role,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    set({ user: null, isAuthenticated: false });
  },
}));
