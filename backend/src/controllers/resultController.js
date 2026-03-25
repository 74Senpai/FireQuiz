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
    const minScore = req.query.minScore ? parseFloat(req.query.minScore) : undefined;
    const maxScore = req.query.maxScore ? parseFloat(req.query.maxScore) : undefined;

    // Validate minScore và maxScore phải là số hợp lệ nếu được cung cấp
    if ((req.query.minScore && isNaN(minScore)) || (req.query.maxScore && isNaN(maxScore))) {
        throw new AppError('Điểm số (minScore/maxScore) không hợp lệ.', 400);
    }

    const filters = {
        minScore,
        maxScore,
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

/**
 * GET /api/result/quiz/:quizId/export
 * -------------------------------------------------------
 * Xuất kết quả thi của một quiz ra file Excel.
 * Chỉ chủ quiz (creator) mới có quyền gọi API này.
 *
 * Query params (lọc, tương tự getResultsByQuizId):
 *  - minScore, maxScore, startDate, endDate, status, search
 *
 * Response 200:
 *  - File Excel (.xlsx) được tải về.
 */
export const exportResults = asyncHandler(async (req, res) => {
    // Lấy quizId và user tương tự các hàm khác
    const quizId = parseInt(req.params.quizId, 10);
    if (isNaN(quizId)) {
        throw new AppError('Quiz ID không hợp lệ', 400);
    }
    const user = req.user;

    // Trích xuất các tham số lọc từ query string (giống hệt getResultsByQuizId)
    const minScore = req.query.minScore ? parseFloat(req.query.minScore) : undefined;
    const maxScore = req.query.maxScore ? parseFloat(req.query.maxScore) : undefined;
    if ((req.query.minScore && isNaN(minScore)) || (req.query.maxScore && isNaN(maxScore))) {
        throw new AppError('Điểm số (minScore/maxScore) không hợp lệ.', 400);
    }
    const filters = {
        minScore,
        maxScore,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        status: ['SUBMITTED', 'IN_PROGRESS'].includes(req.query.status)
            ? req.query.status
            : undefined,
        search: req.query.search,
    };

    // Gọi service để tạo file Excel
    const { fileName, buffer } = await resultService.exportResultsToExcel(quizId, user, filters);

    // Thiết lập header cho response để trình duyệt hiểu đây là file cần tải xuống
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Gửi buffer (nội dung file) về cho client
    res.send(buffer);
});

/**
 * GET /api/result/quiz/:quizId/question-analytics
 * -------------------------------------------------------
 * Lấy thống kê chi tiết theo từng câu hỏi của một quiz.
 * Dùng để vẽ biểu đồ, phân tích độ khó/dễ của câu hỏi.
 * Chỉ chủ quiz (creator) mới có quyền gọi API này.
 *
 * Response 200:
 *  [
 *    {
 *      questionId, questionContent, totalResponses, correctResponses, correctRate,
 *      options: [ { optionId, optionContent, isCorrect, selectionCount } ]
 *    }
 *  ]
 */
export const getQuestionAnalytics = asyncHandler(async (req, res) => {
    // Lấy quizId từ URL params và chuyển sang số nguyên
    const quizId = parseInt(req.params.quizId, 10);

    // Kiểm tra quizId có hợp lệ không
    if (isNaN(quizId)) {
        throw new AppError('Quiz ID không hợp lệ', 400);
    }

    // Lấy thông tin người dùng đang đăng nhập
    const user = req.user;

    // Gọi service để lấy và xử lý dữ liệu thống kê
    const analytics = await resultService.getQuestionAnalytics(quizId, user);

    // Trả về dữ liệu đã được xử lý
    return res.status(200).json(analytics);
});
