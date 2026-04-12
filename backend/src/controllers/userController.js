import { asyncHandler } from '../utils/asyncHandler.js'
import logger from '../utils/logger.js';

export const getMyInfo = asyncHandler(async (req, res) => {
  logger.debug(`userController.js - Current User ID: ${req.user.id}`);
  return res.status(200).json(req.user);
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const { avatar_url } = req.body;
  if (!avatar_url) {
    return res.status(400).json({ success: false, message: 'avatar_url is required' });
  }

  const userRepo = await import('../repositories/userRepository.js');
  await userRepo.updateAvatarUrl(req.user.id, avatar_url);

  return res.status(200).json({ success: true, message: 'Avatar updated successfully', avatar_url });
});


