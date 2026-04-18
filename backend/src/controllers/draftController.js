import { asyncHandler } from '../utils/asyncHandler.js';
import { buildDraftKey, getCache, setCache } from '../cache/cacheClient.js';
import AppError from '../errors/AppError.js';
import { getQuizById } from '../repositories/quizRepository.js';
import { getActiveAttempt } from '../repositories/attemptRepository.js';

/**
 * POST /api/quiz/draft
 * Body: { quizId, answers: { [questionId]: [optionId, ...] }, textAnswers: { [questionId]: string }, timestamp }
 *
 * Lưu draft bài làm vào cache (KHÔNG ghi DB).
 */
export const saveDraft = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { quizId, answers, textAnswers, timestamp } = req.body;

  if (!quizId) {
    throw new AppError('Thiếu quizId', 400);
  }

  const quiz = await getQuizById(quizId);
  if (!quiz) {
    throw new AppError('Quiz không tồn tại', 404);
  }

  const activeAttempt = await getActiveAttempt(quizId, userId);
  if (!activeAttempt) {
    throw new AppError('Bạn không có bài làm đang tiến hành cho quiz này', 403);
  }

  const key = buildDraftKey(quizId, userId);
  const draft = {
    quizId,
    userId,
    answers: answers || {},
    textAnswers: textAnswers || {},
    timestamp: timestamp || Date.now(),
  };

  setCache(key, draft);

  return res.status(204).send();
});

/**
 * GET /api/quiz/draft?quizId=...
 *
 * Lấy draft bài làm từ cache (dùng khi FE reload và local không có).
 */
export const getDraft = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { quizId } = req.query;

  if (!quizId) {
    throw new AppError('Thiếu quizId', 400);
  }

  const key = buildDraftKey(quizId, userId);
  const draft = getCache(key);

  if (!draft) {
    return res.status(404).json({ message: 'Không có draft nào trong cache' });
  }

  return res.status(200).json(draft);
});
