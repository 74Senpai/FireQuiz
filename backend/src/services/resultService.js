/**
 * resultService.js
 * -------------------------------------------------------
 * Tầng xử lý nghiệp vụ (Business Logic Layer) cho chức năng
 * "Dashboard kết quả Quiz" của Chủ Quiz (Creator).
 *
 * Service này chịu trách nhiệm:
 *  1. Kiểm tra quiz có tồn tại không
 *  2. Kiểm tra người dùng có phải chủ quiz không (phân quyền)
 *  3. Gọi repository để lấy dữ liệu
 *  4. Format/transform dữ liệu trước khi trả về controller
 * -------------------------------------------------------
 */

import * as quizRepository from '../repositories/quizRepository.js';
import * as quizAttemptRepository from '../repositories/quizAttemptRepository.js';
import AppError from '../errors/AppError.js';

/**
 * Lấy danh sách kết quả thi của một quiz (có hỗ trợ lọc).
 * Chỉ chủ quiz mới có quyền xem báo cáo này.
 *
 * @param {number} quizId  - ID của quiz
 * @param {object} user    - Thông tin người dùng đang đăng nhập (từ req.user)
 * @param {object} filters - Các tham số lọc từ query string
 * @returns {Promise<Array>} Danh sách kết quả thi đã được format
 */
export const getResultsByQuizId = async (quizId, user, filters) => {
    // Bước 1: Kiểm tra quiz có tồn tại không
    const quiz = await quizRepository.getQuizById(quizId);
    if (!quiz) {
        throw new AppError('Quiz không tồn tại', 404);
    }

    // Bước 2: Kiểm tra quyền - chỉ chủ quiz mới được xem kết quả
    if (quiz.creator_id !== user.id) {
        throw new AppError('Bạn không có quyền xem kết quả của quiz này', 403);
    }

    // Bước 3: Lấy dữ liệu từ repository
    const rawResults = await quizAttemptRepository.getResultsByQuizId(quizId, filters);

    // Bước 4: Format dữ liệu trả về (chuyển đổi kiểu dữ liệu cho FE dễ dùng)
    const formattedResults = rawResults.map((row) => ({
        attemptId: row.attempt_id,
        quizId: row.quiz_id,
        quizTitle: row.quiz_title,
        // Điểm số (null nếu chưa nộp bài)
        score: row.score !== null ? Number(row.score) : null,
        // Thời gian bắt đầu làm bài
        startedAt: row.started_at,
        // Thời gian nộp bài (null nếu đang làm)
        finishedAt: row.finished_at,
        // Thời gian làm bài tính bằng giây (null nếu chưa nộp)
        durationSeconds: row.duration_seconds !== null ? Number(row.duration_seconds) : null,
        // Trạng thái: 'SUBMITTED' | 'IN_PROGRESS'
        submitStatus: row.submit_status,
        // Thông tin thí sinh
        user: {
            id: row.user_id,
            fullName: row.full_name,
            email: row.email,
        },
    }));

    return formattedResults;
};

/**
 * Lấy thống kê tổng quan của một quiz.
 * Chỉ chủ quiz mới có quyền xem.
 *
 * @param {number} quizId - ID của quiz
 * @param {object} user   - Thông tin người dùng đang đăng nhập
 * @returns {Promise<object>} Thống kê tổng quan
 */
export const getQuizStats = async (quizId, user) => {
    // Bước 1: Kiểm tra quiz có tồn tại không
    const quiz = await quizRepository.getQuizById(quizId);
    if (!quiz) {
        throw new AppError('Quiz không tồn tại', 404);
    }

    // Bước 2: Kiểm tra quyền - chỉ chủ quiz mới được xem thống kê
    if (quiz.creator_id !== user.id) {
        throw new AppError('Bạn không có quyền xem thống kê của quiz này', 403);
    }

    // Bước 3: Lấy thống kê từ repository
    const stats = await quizAttemptRepository.getQuizStatsByQuizId(quizId);

    // Bước 4: Format dữ liệu trả về
    return {
        totalAttempts: Number(stats.total_attempts) || 0,
        submittedCount: Number(stats.submitted_count) || 0,
        inProgressCount: Number(stats.in_progress_count) || 0,
        avgScore: stats.avg_score !== null ? Number(stats.avg_score) : null,
        maxScore: stats.max_score !== null ? Number(stats.max_score) : null,
        minScore: stats.min_score !== null ? Number(stats.min_score) : null,
    };
};
