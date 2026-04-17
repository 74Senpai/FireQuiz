import { asyncHandler } from '../utils/asyncHandler.js'
import logger from '../utils/logger.js';
import * as userService from '../services/userService.js';
import AppError from '../errors/AppError.js';

export const getMyInfo = asyncHandler(async (req, res) => {
  logger.debug(`userController.js - Current User ID: ${req.user.id}`);
  return res.status(200).json(req.user);
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const { avatar_url } = req.body;
  if (!avatar_url) {
    return res.status(400).json({ success: false, message: 'avatar_url is required' });
  }

  await userService.updateAvatar(req.user.id, avatar_url);

  return res.status(200).json({ success: true, message: 'Avatar updated successfully', avatar_url });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, email, bio } = req.body;
  if (!fullName || !email) {
    throw new AppError('Họ tên và email là bắt buộc', 400);
  }

  await userService.updateProfileData(req.user.id, { fullName, email, bio });

  return res.status(200).json({ success: true, message: 'Profile updated successfully' });
});



