import { asyncHandler } from '../untils/asyncHandler.js';
import * as attemptService from '../services/attemptService.js';
import AppError from '../errors/AppError.js';

/**
 * PATCH /api/attempts/:id/submit
 * Body: { attemptQuestionId: number, attemptOptionId: number }
 *
 * Chú thích (BE): Controller đồng bộ đáp án tạm thời khi người dùng chọn một đáp án.
 * Được gọi mỗi khi FE detect sự kiện onChange trên radio button.
 */
export const submitAnswer = asyncHandler(async (req, res) => {
  const attemptId = Number(req.params.id);
  const { attemptQuestionId, attemptOptionId } = req.body;
  const user = req.user;

  // Chú thích (BE): Validate input
  if (!attemptQuestionId || !attemptOptionId) {
    throw new AppError('Thiếu attemptQuestionId hoặc attemptOptionId', 400);
  }

  await attemptService.submitAnswer(
    attemptId,
    user.id,
    Number(attemptQuestionId),
    Number(attemptOptionId)
  );

  // Chú thích (BE): Trả 204 No Content – đồng bộ thành công, không cần trả data
  return res.status(204).send();
});

export const startAttempt = asyncHandler(async (req, res) => {
  const quizId = Number(req.params.quizId);
  const user = req.user;

  const result = await attemptService.startAttempt(quizId, user.id);
  
  return res.status(200).json(result);
});
