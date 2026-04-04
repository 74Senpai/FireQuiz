import { asyncHandler } from '../untils/asyncHandler.js';
import * as attemptService from '../services/attemptService.js';
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
