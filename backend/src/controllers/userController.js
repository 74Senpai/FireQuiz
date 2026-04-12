import { asyncHandler } from '../utils/asyncHandler.js'
import logger from '../utils/logger.js';

export const getMyInfo = asyncHandler(async (req, res) => {
  logger.debug(`userController.js - Current User ID: ${req.user.id}`);
  return res.status(200).json(req.user);
});


