import { asyncHandler } from '../untils/asyncHandler.js';
import * as attemptService from '../services/attemptService.js';

/** GET /api/attempt/my?page=&pageSize= */
export const listMyAttempts = asyncHandler(async (req, res) => {
  const result = await attemptService.listMyQuizAttempts(req.user, req.query);
  return res.status(200).json(result);
});

/** GET /api/attempt/:id/review */
export const getAttemptReview = asyncHandler(async (req, res) => {
  const detail = await attemptService.getMyAttemptReviewDetail(req.user, req.params.id);
  return res.status(200).json(detail);
});
