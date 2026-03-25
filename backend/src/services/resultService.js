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
import * as questionRepository from '../repositories/questionRepository.js';
import AppError from '../errors/AppError.js';
import ExcelJS from 'exceljs';

const resolveQuizAndCheckOwner = async (quizId, user, forbiddenMessage) => {
    const quiz = await quizRepository.getQuizById(quizId);

    if (!quiz) {
        throw new AppError('Quiz không tồn tại', 404);
    }

    if (quiz.creator_id !== user.id) {
        throw new AppError(forbiddenMessage, 403);
    }

    return quiz;
};

/**
 * Lấy danh sách kết quả thi của một quiz (có hỗ trợ lọc).
 * Chỉ chủ quiz mới có quyền xem báo cáo này.
 *
 * @param {number} quizId  - ID của quiz
 * @param {object} user    - Thông tin người dùng đang đăng nhập (từ req.user)
* @param {object} filters - Các tham số lọc từ query string
 * @param {object} pagination - Tham số phân trang (page, limit)
 * @returns {Promise<Array>} Danh sách kết quả thi đã được format
 */
export const getResultsByQuizId = async (quizId, user, filters, pagination) => {
    await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Bạn không có quyền xem kết quả của quiz này'
    );

    // Bước 3: Lấy dữ liệu từ repository
    const { data: rawResults, total } = await quizAttemptRepository.getResultsByQuizId(quizId, filters, pagination);

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

    return { data: formattedResults, total };
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
    await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Bạn không có quyền xem thống kê của quiz này'
    );

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

/**
 * Xuất kết quả thi của một quiz ra file Excel.
 * Chỉ chủ quiz mới có quyền thực hiện.
 * @param {number} quizId - ID của quiz
 * @param {object} user - Thông tin người dùng đang đăng nhập
 * @param {object} filters - Các tham số lọc
 * @returns {Promise<Buffer>} Buffer chứa nội dung file Excel
 */
export const exportResultsToExcel = async (quizId, user, filters) => {
    const quiz = await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Bạn không có quyền xuất kết quả của quiz này'
    );

    // Bước 2: Lấy tất cả dữ liệu (không phân trang)
    // Truyền pagination là một object rỗng hoặc limit=null để repo hiểu là không phân trang
    const { data: results } = await quizAttemptRepository.getResultsByQuizId(quizId, filters, {});

    // Bước 3: Tạo file Excel bằng exceljs
    const workbook = new ExcelJS.Workbook();
    workbook.creator = user.fullName || 'FireQuiz';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet(`Kết quả Quiz - ${quiz.title.substring(0, 20)}`);

    // Định nghĩa cột
    worksheet.columns = [
        { header: 'ID Lượt thi', key: 'attemptId', width: 15 },
        { header: 'Họ và tên', key: 'fullName', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Điểm', key: 'score', width: 10, style: { numFmt: '0.00' } },
        { header: 'Trạng thái', key: 'status', width: 15 },
        { header: 'Bắt đầu', key: 'startedAt', width: 20, style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } },
        { header: 'Nộp bài', key: 'finishedAt', width: 20, style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } },
        { header: 'Thời gian làm (giây)', key: 'duration', width: 20 },
    ];

    // Style cho header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Thêm dữ liệu vào worksheet
    results.forEach(result => {
        worksheet.addRow({
            attemptId: result.attempt_id,
            fullName: result.full_name,
            email: result.email,
            score: result.score !== null ? Number(result.score) : null,
            status: result.submit_status === 'SUBMITTED' ? 'Đã nộp' : 'Đang làm',
            startedAt: result.started_at,
            finishedAt: result.finished_at,
            duration: result.duration_seconds,
        });
    });

    // Bước 4: Ghi workbook ra buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return {
        fileName: `KetQuaQuiz_${quizId}_${Date.now()}.xlsx`,
        buffer: buffer,
    };
};

/**
 * Lấy và xử lý thống kê chi tiết cho từng câu hỏi của một quiz.
 *
 * @param {number} quizId - ID của quiz.
 * @param {object} user - Thông tin người dùng đang đăng nhập.
 * @returns {Promise<Array<object>>} Mảng dữ liệu thống kê đã được xử lý.
 */
export const getQuestionAnalytics = async (quizId, user) => {
    await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Bạn không có quyền xem thống kê của quiz này'
    );

    // Bước 2: Lấy dữ liệu thô từ repository
    const rawAnalytics = await questionRepository.getQuestionAnalytics(quizId);

    // Bước 3: Xử lý dữ liệu từ dạng phẳng sang dạng cấu trúc lồng nhau
    // Dữ liệu trả về từ DB là một danh sách dài, mỗi hàng là một answer_option.
    // Ta cần nhóm chúng lại theo từng question_id.
    const analyticsMap = new Map();

    rawAnalytics.forEach(row => {
        const questionId = Number(row.question_id);
        const totalAttempts = Number(row.total_attempts) || 0;
        const submittedAttempts = Number(row.submitted_attempts) || 0;
        const exposureCount = Number(row.exposure_count) || 0;
        const responseCount = Number(row.response_count) || 0;
        const correctCount = Number(row.correct_count) || 0;
        const incorrectCount = Number(row.incorrect_count) || 0;
        const skippedCount = Number(row.skipped_count) || 0;
        const gradingDenominator = exposureCount || submittedAttempts || 0;
        const totalAttemptDenominator = totalAttempts || 0;

        // Nếu chưa có question này trong Map, khởi tạo nó
        if (!analyticsMap.has(questionId)) {
            analyticsMap.set(questionId, {
                questionId,
                questionContent: row.question_content,
                questionType: row.question_type,
                totalAttempts,
                submittedAttempts,
                exposureCount,
                totalResponses: responseCount,
                correctResponses: correctCount,
                incorrectResponses: incorrectCount,
                skippedResponses: skippedCount,
                responseRate: totalAttemptDenominator > 0 ? responseCount / totalAttemptDenominator : 0,
                responseRateOnSubmittedAttempts:
                    submittedAttempts > 0 ? responseCount / submittedAttempts : 0,
                correctRate: gradingDenominator > 0 ? correctCount / gradingDenominator : 0,
                incorrectRate: gradingDenominator > 0 ? incorrectCount / gradingDenominator : 0,
                skippedRate: gradingDenominator > 0 ? skippedCount / gradingDenominator : 0,
                difficulty:
                    gradingDenominator === 0
                        ? 'NO_DATA'
                        : correctCount / gradingDenominator >= 0.8
                            ? 'EASY'
                            : correctCount / gradingDenominator >= 0.5
                                ? 'MEDIUM'
                                : 'HARD',
                options: [],
            });
        }

        // Thêm thông tin option vào câu hỏi tương ứng
        // Chỉ thêm nếu option_id tồn tại (đề phòng câu hỏi không có phương án nào)
        if (row.option_id) {
            analyticsMap.get(questionId).options.push({
                optionId: Number(row.option_id),
                optionContent: row.option_content,
                isCorrect: !!row.is_correct, // Chuyển 0/1 thành false/true
                selectionCount: Number(row.selection_count) || 0,
                selectionRate:
                    gradingDenominator > 0
                        ? (Number(row.selection_count) || 0) / gradingDenominator
                        : 0,
            });
        }
    });

    // Chuyển Map thành mảng để trả về
    return Array.from(analyticsMap.values());
};

export const getQuizLeaderboard = async (quizId, user, limit = 10) => {
    await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Báº¡n khÃ´ng cÃ³ quyá»n xem leaderboard cá»§a quiz nÃ y'
    );

    const rawLeaderboard = await quizAttemptRepository.getLeaderboardByQuizId(quizId, limit);

    return {
        totalParticipants: Number(rawLeaderboard[0]?.total_participants) || 0,
        data: rawLeaderboard.map((row) => ({
            rank: Number(row.rank_position),
            attemptId: row.attempt_id,
            quizId: row.quiz_id,
            quizTitle: row.quiz_title,
            score: row.score !== null ? Number(row.score) : null,
            startedAt: row.started_at,
            finishedAt: row.finished_at,
            durationSeconds: row.duration_seconds !== null ? Number(row.duration_seconds) : null,
            user: {
                id: row.user_id,
                fullName: row.full_name,
                email: row.email,
            },
        })),
    };
};
