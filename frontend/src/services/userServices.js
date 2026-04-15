import axiosInstance from "../api/axios.js";

/**
 * Cập nhật thông tin hồ sơ người dùng (Bio, Tên, Email)
 */
export const updateProfile = async (data) => {
  const res = await axiosInstance.put("/user/profile", data);
  return res.data;
};

/**
 * Cập nhật URL ảnh đại diện trong database
 */
export const updateAvatar = async (avatar_url) => {
  const res = await axiosInstance.put("/user/avatar", { avatar_url });
  return res.data;
};
