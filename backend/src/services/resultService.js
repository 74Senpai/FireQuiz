import writeXlsxFile from 'write-excel-file/node';

import AppError from '../errors/AppError.js';
import * as questionRepository from '../repositories/questionRepository.js';
import * as quizAttemptRepository from '../repositories/quizAttemptRepository.js';
import * as quizRepository from '../repositories/quizRepository.js';

const XLSX_DATE_FORMAT = 'yyyy-mm-dd hh:mm:ss';
const XLSX_SHEET_NAME_MAX_LENGTH = 31;

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

const sanitizeSheetName = (value) => {
    const normalized = String(value || 'Ket qua Quiz')
        .replace(/[\\/*?:[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return (normalized || 'Ket qua Quiz').slice(0, XLSX_SHEET_NAME_MAX_LENGTH);
};

export const getResultsByQuizId = async (quizId, user, filters, pagination) => {
    await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Bạn không có quyền xem kết quả của quiz này'
    );

    const { data: rawResults, total } = await quizAttemptRepository.getResultsByQuizId(
        quizId,
        filters,
        pagination
    );

    const formattedResults = rawResults.map((row) => ({
        attemptId: row.attempt_id,
        quizId: row.quiz_id,
        quizTitle: row.quiz_title,
        score: row.score !== null ? Number(row.score) : null,
        startedAt: row.started_at,
        finishedAt: row.finished_at,
        durationSeconds: row.duration_seconds !== null ? Number(row.duration_seconds) : null,
        submitStatus: row.submit_status,
        user: {
            id: row.user_id,
            fullName: row.full_name,
            email: row.email,
        },
    }));

    return { data: formattedResults, total };
};

export const getQuizStats = async (quizId, user) => {
    await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Bạn không có quyền xem thống kê của quiz này'
    );

    const stats = await quizAttemptRepository.getQuizStatsByQuizId(quizId);

    return {
        totalAttempts: Number(stats.total_attempts) || 0,
        submittedCount: Number(stats.submitted_count) || 0,
        inProgressCount: Number(stats.in_progress_count) || 0,
        avgScore: stats.avg_score !== null ? Number(stats.avg_score) : null,
        maxScore: stats.max_score !== null ? Number(stats.max_score) : null,
        minScore: stats.min_score !== null ? Number(stats.min_score) : null,
    };
};

export const exportResultsToExcel = async (quizId, user, filters) => {
    const quiz = await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Bạn không có quyền xuất kết quả của quiz này'
    );

    const { data: results } = await quizAttemptRepository.getResultsByQuizId(quizId, filters, {});

    const rows = results.map((result) => ({
        attemptId: result.attempt_id,
        fullName: result.full_name ?? '',
        email: result.email ?? '',
        score: result.score !== null ? Number(result.score) : null,
        status: result.submit_status === 'SUBMITTED' ? 'Đã nộp' : 'Đang làm',
        startedAt: result.started_at ? new Date(result.started_at) : null,
        finishedAt: result.finished_at ? new Date(result.finished_at) : null,
        duration: result.duration_seconds !== null ? Number(result.duration_seconds) : null,
    }));

    const schema = [
        {
            column: 'ID lượt thi',
            type: Number,
            value: (row) => row.attemptId,
            width: 15,
            align: 'center',
        },
        {
            column: 'Họ và tên',
            type: String,
            value: (row) => row.fullName,
            width: 30,
        },
        {
            column: 'Email',
            type: String,
            value: (row) => row.email,
            width: 30,
        },
        {
            column: 'Điểm',
            type: Number,
            value: (row) => row.score,
            width: 10,
            format: '0.00',
            align: 'right',
        },
        {
            column: 'Trạng thái',
            type: String,
            value: (row) => row.status,
            width: 15,
            align: 'center',
        },
        {
            column: 'Bắt đầu',
            type: Date,
            value: (row) => row.startedAt,
            width: 20,
            format: XLSX_DATE_FORMAT,
            align: 'center',
        },
        {
            column: 'Nộp bài',
            type: Date,
            value: (row) => row.finishedAt,
            width: 20,
            format: XLSX_DATE_FORMAT,
            align: 'center',
        },
        {
            column: 'Thời gian làm (giây)',
            type: Number,
            value: (row) => row.duration,
            width: 20,
            align: 'right',
        },
    ];

    const buffer = await writeXlsxFile(rows, {
        schema,
        buffer: true,
        sheet: sanitizeSheetName(`Kết quả Quiz - ${quiz.title}`),
        fontFamily: 'Calibri',
        fontSize: 11,
        stickyRowsCount: 1,
        dateFormat: XLSX_DATE_FORMAT,
    });

    return {
        fileName: `KetQuaQuiz_${quizId}_${Date.now()}.xlsx`,
        buffer,
    };
};

export const getQuestionAnalytics = async (quizId, user) => {
    await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Bạn không có quyền xem thống kê của quiz này'
    );

    const rawAnalytics = await questionRepository.getQuestionAnalytics(quizId);
    const analyticsMap = new Map();

    rawAnalytics.forEach((row) => {
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

        if (row.option_id) {
            analyticsMap.get(questionId).options.push({
                optionId: Number(row.option_id),
                optionContent: row.option_content,
                isCorrect: !!row.is_correct,
                selectionCount: Number(row.selection_count) || 0,
                selectionRate:
                    gradingDenominator > 0
                        ? (Number(row.selection_count) || 0) / gradingDenominator
                        : 0,
            });
        }
    });

    return Array.from(analyticsMap.values());
};

export const getQuizLeaderboard = async (quizId, user, limit = 10) => {
    await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Bạn không có quyền xem bảng xếp hạng của quiz này'
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
