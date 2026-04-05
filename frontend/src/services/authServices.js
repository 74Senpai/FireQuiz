import axiosInstance from "../api/axios.js";

export const login = async (data) => {
  const res = await axiosInstance.post("/auth/login", data);
  return res.data;
};

export const getProfile = async () => {
  const res = await axiosInstance.get("/user/me");
  return res.data;
};

export const logout = async () => {
  await axiosInstance.post("/auth/logout");
};

export const register = async (data) => {
  const res = await axiosInstance.post("/auth/register", data);
  return res.data;
};

export const forgotPassword = (email) => {
  return axiosInstance.post("/auth/forgot-password", { email });
};

export const verifyOTP = async (data) => {
  const res = await axiosInstance.post("/auth/verify-otp", data);
  return res.data;
};

export const resetPassword = (data) => {
  return axiosInstance.post("/auth/reset-password", data);
};
