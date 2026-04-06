import { asyncHandler } from '../untils/asyncHandler.js';
import * as attemptService from '../services/attemptService.js';

/** GET /api/attempt/my?page=&pageSize= */
export const listMyAttempts = asyncHandler(async (req, res) => {
  if (req.query.page && req.query.pageSize) {
    if (isNaN(req.query.page) || isNaN(req.query.pageSize)) {
      return res.status(400).json({ message: 'Page and pageSize must be numbers' });
    }
    if (req.query.page < 1 || req.query.pageSize < 1) {
      return res.status(400).json({ message: 'Page and pageSize must be greater than 0' });
    }
  }
  const result = await attemptService.listMyQuizAttempts(req.user, req.query);
  return res.status(200).json(result);
});

/** GET /api/attempt/:id/review */
export const getAttemptReview = asyncHandler(async (req, res) => {
  if (isNaN(req.params.id)) {
    return res.status(400).json({ message: 'Attempt ID must be a number' });
  }
  if (req.params.id < 1) {
    return res.status(400).json({ message: 'Attempt ID must be greater than 0' });
  }
  const detail = await attemptService.getMyAttemptReviewDetail(req.user, req.params.id);
  return res.status(200).json(detail);
});
