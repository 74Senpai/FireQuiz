/**
 * resultRoute.js
 * -------------------------------------------------------
 * Định nghĩa các route cho chức năng "Dashboard kết quả Quiz".
 *
 * Tất cả các route trong file này đều yêu cầu xác thực
 * (protectedRoute middleware) vì chỉ chủ quiz mới được xem.
 *
 * Base path: /api/result
 * -------------------------------------------------------
 *
 * Danh sách endpoints:
 *
 *  GET /api/result/quiz/:quizId
 *      → Lấy danh sách kết quả thi của quiz (có lọc)
 *      → Query: minScore, maxScore, startDate, endDate, status, search
 *
 *  GET /api/result/quiz/:quizId/stats
 *      → Lấy thống kê tổng quan của quiz
 *        (tổng lượt thi, điểm TB, điểm cao/thấp nhất, ...)
 */

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
