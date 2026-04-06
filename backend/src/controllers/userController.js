import { asyncHandler } from '../utils/asyncHandler.js'

export const getMyInfo = asyncHandler(async (req, res) => {
  console.log(req.user);
  return res.status(200).json(req.user);
});


