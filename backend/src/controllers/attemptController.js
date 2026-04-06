import { asyncHandler } from '../utils/asyncHandler.js';
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
import AppError from '../errors/AppError.js';

/**
 * PATCH /api/attempts/:id/answer
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
    // Chú thích (BE): Nên để Frontend xử lý và không hiển thị lỗi của API này. 
    // Vì request được trigger tự động khi người dùng chọn đáp án (onChange), 
    // nên việc hiển thị lỗi sẽ không mang lại giá trị cho UX.
    return res.status(400).json({ message: 'Thiếu attemptQuestionId hoặc attemptOptionId' });
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

/**
 * PATCH /api/attempts/:id/submit
 * Chú thích (BE): Controller nộp bài chính thức, khóa bài và chấm toán điểm.
 * Gọi khi hết giờ hoặc user chủ động nộp.
 */
export const completeAttempt = asyncHandler(async (req, res) => {
  const attemptId = Number(req.params.id);
  const user = req.user;

  const result = await attemptService.finishAttempt(attemptId, user.id);

  return res.status(200).json(result);
});

/**
 * PATCH /api/attempts/:id/violation
 * Chú thích (BE): Controller ghi nhận vi phạm chuyển tab.
 */
export const reportViolation = asyncHandler(async (req, res) => {
  const attemptId = Number(req.params.id);
  const user = req.user;

  await attemptService.recordTabViolation(attemptId, user.id);

  return res.status(200).json({ message: 'Đã báo cáo vi phạm thành công' });
});
