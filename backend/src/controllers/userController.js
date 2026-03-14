import { asyncHandler } from '../untils/asyncHandler.js'

export const getMyInfo = asyncHandler(async (req, res) => {
  return res.status(200).json(req.user);
});


