import * as userRepository from '../repositories/userRepository.js';
import logger from '../utils/logger.js';
import { deleteFileFromSupabase, supabaseAvatarBucket } from './supabaseService.js';
import * as mediaService from './mediaService.js';

export const getUserById = async (id) => {
  const user = await userRepository.findById(id);

  if (!user) {
    return null;
  }

  logger.info(
    `userService.js - id: ${user.id}, role: ${user.role}, fullName: ${user.full_name}`,
  );

  return mediaService.hydrateUser({
    id: user.id,
    role: user.role,
    fullName: user.full_name,
    email: user.email,
    avatar_url: user.avatar_url,
    bio: user.bio
  });
};

export const updateAvatar = async (userId, newAvatarUrl) => {
  const user = await userRepository.findById(userId);
  if (!user) return;

  const oldAvatarUrl = user.avatar_url;
  await userRepository.updateAvatar(userId, newAvatarUrl);

  // Thử xóa avatar cũ nếu có thay đổi
  if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
    await deleteFileFromSupabase(oldAvatarUrl, supabaseAvatarBucket);
  }
};

export const updateProfileData = async (userId, data) => {
  const { email } = data;
  if (email) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      throw new AppError("Email đã được sử dụng bởi người dùng khác", 409);
    }
  }
  return await userRepository.updateProfileData(userId, data);
};

