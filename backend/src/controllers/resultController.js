import { asyncHandler } from '../untils/asyncHandler.js';
import * as resultService from '../services/resultService.js';
import AppError from '../errors/AppError.js';

const parseQuizId = (quizIdParam) => {
    const quizId = parseInt(quizIdParam, 10);

    if (isNaN(quizId)) {
        throw new AppError('Quiz ID khong hop le', 400);
    }

    return quizId;
};

const parseScoreFilters = (query) => {
    const minScore = query.minScore ? parseFloat(query.minScore) : undefined;
    const maxScore = query.maxScore ? parseFloat(query.maxScore) : undefined;

    if ((query.minScore && isNaN(minScore)) || (query.maxScore && isNaN(maxScore))) {
        throw new AppError('Diem so (minScore/maxScore) khong hop le.', 400);
    }

    return { minScore, maxScore };
};

const parseResultFilters = (query) => {
    const { minScore, maxScore } = parseScoreFilters(query);

    return {
        minScore,
        maxScore,
        startDate: query.startDate,
        endDate: query.endDate,
        status: ['SUBMITTED', 'IN_PROGRESS'].includes(query.status)
            ? query.status
            : undefined,
        search: query.search,
    };
};

const parsePagination = (query) => {
    const parsedLimit = parseInt(query.limit, 10);
    const parsedOffset = parseInt(query.offset, 10);

    return {
        limit: Math.max(1, Math.min(Number.isNaN(parsedLimit) ? 10 : parsedLimit, 100)),
        offset: Math.max(0, Number.isNaN(parsedOffset) ? 0 : parsedOffset),
    };
};

export const getResultsByQuizId = asyncHandler(async (req, res) => {
    const quizId = parseQuizId(req.params.quizId);
    const filters = parseResultFilters(req.query);
    const { limit, offset } = parsePagination(req.query);

    const results = await resultService.getResultsByQuizId(
        quizId,
        req.user,
        filters,
        { limit, offset }
    );

    return res.status(200).json({
        data: results.data,
        total: results.total,
        limit,
        offset,
    });
});

export const getQuizStats = asyncHandler(async (req, res) => {
    const quizId = parseQuizId(req.params.quizId);
    const stats = await resultService.getQuizStats(quizId, req.user);

    return res.status(200).json(stats);
});

export const exportResults = asyncHandler(async (req, res) => {
    const quizId = parseQuizId(req.params.quizId);
    const filters = parseResultFilters(req.query);
    const { fileName, buffer } = await resultService.exportResultsToExcel(
        quizId,
        req.user,
        filters
    );

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    res.send(buffer);
});

export const getQuestionAnalytics = asyncHandler(async (req, res) => {
    const quizId = parseQuizId(req.params.quizId);
    const analytics = await resultService.getQuestionAnalytics(quizId, req.user);

    return res.status(200).json({
        data: analytics,
    });
});

export const getQuizLeaderboard = asyncHandler(async (req, res) => {
    const quizId = parseQuizId(req.params.quizId);
    const rawLimit = Number(req.query.limit);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, 50)
        : 10;

    const leaderboard = await resultService.getQuizLeaderboard(
        quizId,
        req.user,
        limit
    );

    return res.status(200).json(leaderboard);
});
