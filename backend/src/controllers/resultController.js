/**
 * resultController.js
 * -------------------------------------------------------
 * Tầng xử lý HTTP Request/Response (Controller Layer) cho
 * chức năng "Dashboard kết quả Quiz" của Chủ Quiz (Creator).
 *
 * Controller này nhận request từ client, trích xuất tham số,
 * gọi service xử lý nghiệp vụ, rồi trả về response JSON.
 * -------------------------------------------------------
 */

import { asyncHandler } from '../untils/asyncHandler.js';
import * as resultService from '../services/resultService.js';
import AppError from '../errors/AppError.js';

/**
 * GET /api/result/quiz/:quizId
 * -------------------------------------------------------
 * Lấy danh sách kết quả thi của một quiz (có hỗ trợ lọc).
 * Chỉ chủ quiz (creator) mới có quyền gọi API này.
 *
 * Query params (tất cả đều tùy chọn):
 *  - minScore   : Điểm tối thiểu (số thực, vd: 5.0)
 *  - maxScore   : Điểm tối đa (số thực, vd: 10.0)
 *  - startDate  : Ngày bắt đầu lọc (YYYY-MM-DD, vd: 2024-01-01)
 *  - endDate    : Ngày kết thúc lọc (YYYY-MM-DD, vd: 2024-12-31)
 *  - status     : Trạng thái nộp bài ('SUBMITTED' | 'IN_PROGRESS')
 *  - search     : Tìm kiếm theo tên hoặc email thí sinh
 *
 * Response 200:
 *  {
 *    data: [
 *      {
 *        attemptId, quizId, quizTitle, score,
 *        startedAt, finishedAt, durationSeconds,
 *        submitStatus, user: { id, fullName, email }
 *      }
 *    ],
 *    total: number  // Tổng số bản ghi
 *  }
 */
export const getResultsByQuizId = asyncHandler(async (req, res) => {
    // Lấy quizId từ URL params và chuyển sang số nguyên
    const quizId = parseInt(req.params.quizId, 10);

    // Kiểm tra quizId có hợp lệ không
    if (isNaN(quizId)) {
        throw new AppError('Quiz ID không hợp lệ', 400);
    }

    // Lấy thông tin người dùng đang đăng nhập (được gắn bởi protectedRoute middleware)
    const user = req.user;

    // Trích xuất các tham số lọc từ query string
    const filters = {
        minScore: req.query.minScore,
        maxScore: req.query.maxScore,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        // Chỉ chấp nhận giá trị hợp lệ cho status
        status: ['SUBMITTED', 'IN_PROGRESS'].includes(req.query.status)
            ? req.query.status
            : undefined,
        search: req.query.search,
    };

    // Phân trang (thông số từ query string, default 10 / 0)
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const offset = Number(req.query.offset) >= 0 ? Number(req.query.offset) : 0;

    // Gọi service để xử lý nghiệp vụ
    const results = await resultService.getResultsByQuizId(quizId, user, filters, { limit, offset });

    // Trả về danh sách kết quả kèm tổng số bản ghi + phân trang
    return res.status(200).json({
        data: results.data,
        total: results.total,
        limit,
        offset,
    });
});

/**
 * GET /api/result/quiz/:quizId/stats
 * -------------------------------------------------------
 * Lấy thống kê tổng quan của một quiz.
 * Chỉ chủ quiz (creator) mới có quyền gọi API này.
 *
 * Response 200:
 *  {
 *    totalAttempts  : number,  // Tổng số lượt thi
 *    submittedCount : number,  // Số lượt đã nộp bài
 *    inProgressCount: number,  // Số lượt đang làm
 *    avgScore       : number | null,  // Điểm trung bình
 *    maxScore       : number | null,  // Điểm cao nhất
 *    minScore       : number | null   // Điểm thấp nhất
 *  }
 */
export const getQuizStats = asyncHandler(async (req, res) => {
    // Lấy quizId từ URL params và chuyển sang số nguyên
    const quizId = parseInt(req.params.quizId, 10);

    // Kiểm tra quizId có hợp lệ không
    if (isNaN(quizId)) {
        throw new AppError('Quiz ID không hợp lệ', 400);
    }

    // Lấy thông tin người dùng đang đăng nhập
    const user = req.user;

    // Gọi service để lấy thống kê
    const stats = await resultService.getQuizStats(quizId, user);

    return res.status(200).json(stats);
});
