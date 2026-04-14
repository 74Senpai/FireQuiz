import axiosInstance from "../api/axios.js";

export const getMyInfo = async () => {
  const res = await axiosInstance.get("/user/me");
  return res.data;
};

export const updateAvatar = async (avatarUrl) => {
  const res = await axiosInstance.put("/user/avatar", { avatar_url: avatarUrl });
  return res.data;
};

export const updateProfile = async (data) => {
  const res = await axiosInstance.put("/user/profile", data);
  return res.data;
};
