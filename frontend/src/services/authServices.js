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

export const sendSignUpOTP = async (email) => {
  const res = await axiosInstance.post("/auth/send-signup-otp", { email });
  return res.data;
};

export const forgotPassword = async (email) => {
  const res = await axiosInstance.post("/auth/forgot-password", { email });
  return res.data;
};

export const verifyOTP = async (data) => {
  const res = await axiosInstance.post("/auth/verify-otp", data);
  return res.data;
};

export const resetPassword = async (data) => {
  const res = await axiosInstance.post("/auth/reset-password", data);
  return res.data;
};

export const changePassword = async (oldPassword, newPassword) => {
  const res = await axiosInstance.put("/auth/change-password", { oldPassword, newPassword });
  return res.data;
};

