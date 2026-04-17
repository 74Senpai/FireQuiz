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
/**
 * PATCH /api/attempts/:id/answer  →  ĐÃ XÓA (không còn dùng)
 * Đáp án giờ được gửi qua POST /api/quiz/draft (draft) hoặc PATCH /:id/submit (submit chính thức).
 */

export const startAttempt = asyncHandler(async (req, res) => {
  const quizId = Number(req.params.quizId);
  const user = req.user;

  const result = await attemptService.startAttempt(quizId, user.id);

  return res.status(200).json(result);
});

/**
 * PATCH /api/attempts/:id/submit
 * Body: { answers: { [attemptQuestionId]: [attemptOptionId, ...] }, textAnswers: { [attemptQuestionId]: string } }
 *
 * Chú thích (BE): Controller nộp bài chính thức.
 * - Nhận toàn bộ đáp án từ FE (không đọc cache).
 * - Ghi hàng loạt vào DB, tính điểm, khóa bài, xóa cache draft.
 */
export const completeAttempt = asyncHandler(async (req, res) => {
  const attemptId = Number(req.params.id);
  const user = req.user;
  const { answers = {}, textAnswers = {} } = req.body;

  const result = await attemptService.finishAttempt(attemptId, user.id, answers, textAnswers);

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

export const getMyStats = asyncHandler(async (req, res) => {
  const stats = await attemptService.getMyHistoryStats(req.user.id);
  return res.status(200).json(stats);
});

/**
 * GET /api/attempts/:id/export-review?format=pdf|excel&type=review|paper|solutions
 * Chú thích (BE): Xuất tài liệu ôn tập cá nhân
 */
export const exportAttemptReview = asyncHandler(async (req, res) => {
  const attemptId = Number(req.params.id);
  const user = req.user;
  const { format = 'pdf', type = 'review' } = req.query;

  const { getQuizAttemptById } = await import('../repositories/attemptRepository.js');
  const { 
    buildAttemptReviewPdf, 
    buildAttemptReviewExcel,
    buildQuizContentPdf,
    buildQuizContentExcel
  } = await import('../services/quizReportService.js');

  const attempt = await getQuizAttemptById(attemptId);
  if (!attempt || attempt.user_id !== user.id) {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập bản in này' });
  }

  let result;
  if (type === 'review') {
    result = format === 'pdf' 
      ? await buildAttemptReviewPdf(attemptId, user)
      : await buildAttemptReviewExcel(attemptId, user);
  } else {
    // Các bản 'paper' (đề) hoặc 'solutions' (đáp án gốc) lấy từ Quiz cha
    const options = { type, format, isParticipant: true };
    result = format === 'pdf'
      ? await buildQuizContentPdf(attempt.quiz_id, user, options)
      : await buildQuizContentExcel(attempt.quiz_id, user, options);
  }

  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
  return res.send(result.buffer);
});

