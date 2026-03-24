import express from 'express';
import * as resultController from '../controllers/resultController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/result/quiz/:quizId
 * Lấy danh sách kết quả thi của một quiz, hỗ trợ lọc theo:
 * điểm số, thời gian nộp bài, trạng thái, tên/email thí sinh.
 * Yêu cầu: đã đăng nhập và là chủ quiz.
 */
router.get('/quiz/:quizId', protectedRoute, resultController.getResultsByQuizId);

/**
 * GET /api/result/quiz/:quizId/stats
 * Lấy thống kê tổng quan của quiz:
 * tổng lượt thi, số đã nộp, điểm TB, điểm cao/thấp nhất.
 * Yêu cầu: đã đăng nhập và là chủ quiz.
 */
router.get('/quiz/:quizId/stats', protectedRoute, resultController.getQuizStats);

export default router;
