import writeXlsxFile from 'write-excel-file/node';

import AppError from '../errors/AppError.js';
import {
    getAnswersByQuestionIds,
    getAttemptAnswerCountsByAttemptOptionIds,
    getAttemptOptionsByAttemptQuestionIds,
    getAutoGradableQuestionsByQuizId,
    getSubmittedAttemptQuestionsByQuizId,
    hasStableAttemptReferenceColumns,
} from '../repositories/questionRepository.js';
import {
    countAttemptsByQuizId,
    getAttemptsByQuizId,
    getAttemptsWithUsersByQuizId,
    getSubmittedAttemptsWithUsersByQuizId,
} from '../repositories/quizAttemptRepository.js';
import { getQuizById } from '../repositories/quizRepository.js';

const XLSX_DATE_FORMAT = 'yyyy-mm-dd hh:mm:ss';
const XLSX_SHEET_NAME_MAX_LENGTH = 31;

const resolveQuizAndCheckOwner = async (quizId, user, forbiddenMessage) => {
    const quiz = await getQuizById(quizId);

    if (!quiz) {
        throw new AppError('Quiz khong ton tai', 404);
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

const toDate = (value) => (value ? new Date(value) : null);

const getDurationSeconds = (startedAt, finishedAt) => {
    if (!startedAt || !finishedAt) {
        return null;
    }

    const durationMs = toDate(finishedAt)?.getTime() - toDate(startedAt)?.getTime();
    if (!Number.isFinite(durationMs) || durationMs < 0) {
        return null;
    }

    return Math.floor(durationMs / 1000);
};

const formatAttemptResult = (row) => ({
    attemptId: row.attempt_id,
    quizId: row.quiz_id,
    quizTitle: row.quiz_title,
    score: row.score !== null ? Number(row.score) : null,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationSeconds: getDurationSeconds(row.started_at, row.finished_at),
    submitStatus: row.finished_at ? 'SUBMITTED' : 'IN_PROGRESS',
    user: {
        id: row.user_id,
        fullName: row.full_name,
        email: row.email,
    },
});

const isAttemptBetter = (candidate, current) => {
    if (!current) {
        return true;
    }

    const candidateScore = candidate.score ?? Number.NEGATIVE_INFINITY;
    const currentScore = current.score ?? Number.NEGATIVE_INFINITY;

    if (candidateScore !== currentScore) {
        return candidateScore > currentScore;
    }

    const candidateDuration = candidate.durationSeconds ?? Number.POSITIVE_INFINITY;
    const currentDuration = current.durationSeconds ?? Number.POSITIVE_INFINITY;

    if (candidateDuration !== currentDuration) {
        return candidateDuration < currentDuration;
    }

    const candidateFinishedAt = toDate(candidate.finishedAt)?.getTime() ?? Number.POSITIVE_INFINITY;
    const currentFinishedAt = toDate(current.finishedAt)?.getTime() ?? Number.POSITIVE_INFINITY;

    if (candidateFinishedAt !== currentFinishedAt) {
        return candidateFinishedAt < currentFinishedAt;
    }

    return candidate.attemptId < current.attemptId;
};

const compareLeaderboardEntries = (left, right) => {
    if ((left.score ?? Number.NEGATIVE_INFINITY) !== (right.score ?? Number.NEGATIVE_INFINITY)) {
        return (right.score ?? Number.NEGATIVE_INFINITY) - (left.score ?? Number.NEGATIVE_INFINITY);
    }

    if ((left.durationSeconds ?? Number.POSITIVE_INFINITY) !== (right.durationSeconds ?? Number.POSITIVE_INFINITY)) {
        return (left.durationSeconds ?? Number.POSITIVE_INFINITY) - (right.durationSeconds ?? Number.POSITIVE_INFINITY);
    }

    const leftFinishedAt = toDate(left.finishedAt)?.getTime() ?? Number.POSITIVE_INFINITY;
    const rightFinishedAt = toDate(right.finishedAt)?.getTime() ?? Number.POSITIVE_INFINITY;

    if (leftFinishedAt !== rightFinishedAt) {
        return leftFinishedAt - rightFinishedAt;
    }

    return left.attemptId - right.attemptId;
};

const buildQuestionAnalyticsBase = (questions, questionOptions, totalAttempts, submittedAttempts) => {
    return questions.map((question) => ({
        questionId: question.id,
        questionContent: question.content,
        questionType: question.type,
        totalAttempts,
        submittedAttempts,
        exposureCount: 0,
        totalResponses: 0,
        correctResponses: 0,
        incorrectResponses: 0,
        skippedResponses: 0,
        responseRate: 0,
        responseRateOnSubmittedAttempts: 0,
        correctRate: 0,
        incorrectRate: 0,
        skippedRate: 0,
        difficulty: 'NO_DATA',
        options: (questionOptions.get(question.id) || []).map((option) => ({
            optionId: option.id,
            optionContent: option.content,
            isCorrect: !!option.is_correct,
            selectionCount: 0,
            selectionRate: 0,
        })),
    }));
};

const indexBy = (items, keySelector) => {
    const map = new Map();

    items.forEach((item) => {
        map.set(keySelector(item), item);
    });

    return map;
};

const groupBy = (items, keySelector) => {
    const map = new Map();

    items.forEach((item) => {
        const key = keySelector(item);
        const current = map.get(key) || [];
        current.push(item);
        map.set(key, current);
    });

    return map;
};

const createLegacyMappings = (questions, attemptQuestions) => {
    const attemptQuestionsByAttemptId = groupBy(attemptQuestions, (row) => row.quiz_attempt_id);
    const mappings = [];

    attemptQuestionsByAttemptId.forEach((rows, quizAttemptId) => {
        questions.forEach((question, index) => {
            const attemptQuestion = rows[index];

            if (!attemptQuestion || attemptQuestion.type !== question.type) {
                return;
            }

            mappings.push({
                questionId: question.id,
                quizAttemptId,
                attemptQuestionId: attemptQuestion.id,
            });
        });
    });

    return mappings;
};

const createStableMappings = (questions, attemptQuestions) => {
    const questionIds = new Set(questions.map((question) => question.id));

    return attemptQuestions
        .filter((row) => row.original_question_id && questionIds.has(row.original_question_id))
        .map((row) => ({
            questionId: row.original_question_id,
            quizAttemptId: row.quiz_attempt_id,
            attemptQuestionId: row.id,
        }));
};

const buildMappedOptions = ({
    questionId,
    attemptQuestionId,
    isStableMapping,
    questionOptionMap,
    attemptOptionsByAttemptQuestionId,
    selectionCountByAttemptOptionId,
}) => {
    const questionOptions = questionOptionMap.get(questionId) || [];
    const attemptOptions = attemptOptionsByAttemptQuestionId.get(attemptQuestionId) || [];

    if (isStableMapping) {
        const attemptOptionsByOriginalAnswerId = indexBy(
            attemptOptions.filter((option) => option.original_answer_id !== null),
            (option) => option.original_answer_id
        );

        return questionOptions.map((option) => {
            const attemptOption = attemptOptionsByOriginalAnswerId.get(option.id);

            return {
                option,
                selectionCount: attemptOption
                    ? Number(selectionCountByAttemptOptionId.get(attemptOption.id) || 0)
                    : 0,
            };
        });
    }

    return questionOptions.map((option, index) => {
        const attemptOption = attemptOptions[index];

        return {
            option,
            selectionCount: attemptOption
                ? Number(selectionCountByAttemptOptionId.get(attemptOption.id) || 0)
                : 0,
        };
    });
};

const isCorrectSubmission = (questionType, mappedOptions) => {
    const selectedOptions = mappedOptions.filter((item) => item.selectionCount > 0);
    const correctOptions = mappedOptions.filter((item) => item.option.is_correct);
    const selectedCorrectOptions = selectedOptions.filter((item) => item.option.is_correct);
    const selectedIncorrectOptions = selectedOptions.filter((item) => !item.option.is_correct);

    if (questionType === 'ANANSWER') {
        return (
            selectedOptions.length === 1 &&
            selectedCorrectOptions.length === 1 &&
            selectedIncorrectOptions.length === 0
        );
    }

    if (questionType === 'MULTI_ANSWERS') {
        return (
            selectedOptions.length > 0 &&
            selectedCorrectOptions.length === correctOptions.length &&
            selectedIncorrectOptions.length === 0 &&
            selectedOptions.length === correctOptions.length
        );
    }

    return false;
};

const finalizeQuestionAnalytics = (analytics) => {
    analytics.forEach((item) => {
        item.incorrectResponses = Math.max(item.totalResponses - item.correctResponses, 0);
        item.skippedResponses = Math.max(item.exposureCount - item.totalResponses, 0);

        const totalAttemptDenominator = item.totalAttempts || 0;
        const gradingDenominator = item.exposureCount || item.submittedAttempts || 0;

        item.responseRate =
            totalAttemptDenominator > 0 ? item.totalResponses / totalAttemptDenominator : 0;
        item.responseRateOnSubmittedAttempts =
            item.submittedAttempts > 0 ? item.totalResponses / item.submittedAttempts : 0;
        item.correctRate =
            gradingDenominator > 0 ? item.correctResponses / gradingDenominator : 0;
        item.incorrectRate =
            gradingDenominator > 0 ? item.incorrectResponses / gradingDenominator : 0;
        item.skippedRate =
            gradingDenominator > 0 ? item.skippedResponses / gradingDenominator : 0;
        item.difficulty =
            gradingDenominator === 0
                ? 'NO_DATA'
                : item.correctRate >= 0.8
                    ? 'EASY'
                    : item.correctRate >= 0.5
                        ? 'MEDIUM'
                        : 'HARD';

        item.options = item.options.map((option) => ({
            ...option,
            selectionRate:
                gradingDenominator > 0 ? option.selectionCount / gradingDenominator : 0,
        }));
    });

    return analytics;
};

export const getResultsByQuizId = async (quizId, user, filters, pagination) => {
    await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Ban khong co quyen xem ket qua cua quiz nay'
    );

    const total = await countAttemptsByQuizId(quizId, filters);
    const rawResults = await getAttemptsWithUsersByQuizId(quizId, filters, pagination);

    return {
        data: rawResults.map(formatAttemptResult),
        total,
    };
};

export const getQuizStats = async (quizId, user) => {
    await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Ban khong co quyen xem thong ke cua quiz nay'
    );

    const attempts = await getAttemptsByQuizId(quizId);
    let submittedCount = 0;
    let inProgressCount = 0;
    let scoreSum = 0;
    let scoreCount = 0;
    let maxScore = null;
    let minScore = null;

    attempts.forEach((attempt) => {
        const score = attempt.score !== null ? Number(attempt.score) : null;

        if (attempt.finished_at) {
            submittedCount += 1;

            if (score !== null) {
                scoreSum += score;
                scoreCount += 1;
                maxScore = maxScore === null ? score : Math.max(maxScore, score);
                minScore = minScore === null ? score : Math.min(minScore, score);
            }
        } else {
            inProgressCount += 1;
        }
    });

    return {
        totalAttempts: attempts.length,
        submittedCount,
        inProgressCount,
        avgScore: scoreCount > 0 ? Number((scoreSum / scoreCount).toFixed(2)) : null,
        maxScore,
        minScore,
    };
};

export const exportResultsToExcel = async (quizId, user, filters) => {
    const quiz = await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Ban khong co quyen xuat ket qua cua quiz nay'
    );

    const rawResults = await getAttemptsWithUsersByQuizId(quizId, filters, {});
    const results = rawResults.map(formatAttemptResult);

    const rows = results.map((result) => ({
        attemptId: result.attemptId,
        fullName: result.user.fullName ?? '',
        email: result.user.email ?? '',
        score: result.score,
        status: result.submitStatus === 'SUBMITTED' ? 'Da nop' : 'Dang lam',
        startedAt: result.startedAt ? new Date(result.startedAt) : null,
        finishedAt: result.finishedAt ? new Date(result.finishedAt) : null,
        duration: result.durationSeconds,
    }));

    const schema = [
        {
            column: 'ID luot thi',
            type: Number,
            value: (row) => row.attemptId,
            width: 15,
            align: 'center',
        },
        {
            column: 'Ho va ten',
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
            column: 'Diem',
            type: Number,
            value: (row) => row.score,
            width: 10,
            format: '0.00',
            align: 'right',
        },
        {
            column: 'Trang thai',
            type: String,
            value: (row) => row.status,
            width: 15,
            align: 'center',
        },
        {
            column: 'Bat dau',
            type: Date,
            value: (row) => row.startedAt,
            width: 20,
            format: XLSX_DATE_FORMAT,
            align: 'center',
        },
        {
            column: 'Nop bai',
            type: Date,
            value: (row) => row.finishedAt,
            width: 20,
            format: XLSX_DATE_FORMAT,
            align: 'center',
        },
        {
            column: 'Thoi gian lam (giay)',
            type: Number,
            value: (row) => row.duration,
            width: 20,
            align: 'right',
        },
    ];

    const buffer = await writeXlsxFile(rows, {
        schema,
        buffer: true,
        sheet: sanitizeSheetName(`Ket qua Quiz - ${quiz.title}`),
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
        'Ban khong co quyen xem thong ke cua quiz nay'
    );

    const [attempts, questions, useStableMapping] = await Promise.all([
        getAttemptsByQuizId(quizId),
        getAutoGradableQuestionsByQuizId(quizId),
        hasStableAttemptReferenceColumns(),
    ]);

    if (questions.length === 0) {
        return [];
    }

    const submittedAttempts = attempts.filter((attempt) => attempt.finished_at);
    const answers = await getAnswersByQuestionIds(questions.map((question) => question.id));
    const questionOptions = groupBy(answers, (row) => row.question_id);
    const analytics = buildQuestionAnalyticsBase(
        questions,
        questionOptions,
        attempts.length,
        submittedAttempts.length
    );
    const analyticsByQuestionId = indexBy(analytics, (item) => item.questionId);

    const attemptQuestions = await getSubmittedAttemptQuestionsByQuizId(quizId);
    const mappings = useStableMapping
        ? createStableMappings(questions, attemptQuestions)
        : createLegacyMappings(questions, attemptQuestions);

    const attemptQuestionIds = mappings.map((mapping) => mapping.attemptQuestionId);
    const attemptOptions = await getAttemptOptionsByAttemptQuestionIds(attemptQuestionIds);
    const attemptOptionsByAttemptQuestionId = groupBy(
        attemptOptions,
        (row) => row.attempt_question_id
    );
    const attemptAnswerCounts = await getAttemptAnswerCountsByAttemptOptionIds(
        attemptOptions.map((row) => row.id)
    );
    const selectionCountByAttemptOptionId = new Map(
        attemptAnswerCounts.map((row) => [
            row.attempt_option_id,
            Number(row.selection_count) || 0,
        ])
    );
    const questionOptionMap = groupBy(answers, (row) => row.question_id);

    mappings.forEach((mapping) => {
        const analyticsItem = analyticsByQuestionId.get(mapping.questionId);
        if (!analyticsItem) {
            return;
        }

        analyticsItem.exposureCount += 1;

        const mappedOptions = buildMappedOptions({
            questionId: mapping.questionId,
            attemptQuestionId: mapping.attemptQuestionId,
            isStableMapping: useStableMapping,
            questionOptionMap,
            attemptOptionsByAttemptQuestionId,
            selectionCountByAttemptOptionId,
        });

        const selectedOptions = mappedOptions.filter((item) => item.selectionCount > 0);

        mappedOptions.forEach(({ option, selectionCount }) => {
            const optionAnalytics = analyticsItem.options.find(
                (candidate) => candidate.optionId === option.id
            );

            if (optionAnalytics) {
                optionAnalytics.selectionCount += selectionCount;
            }
        });

        if (selectedOptions.length > 0) {
            analyticsItem.totalResponses += 1;
        }

        if (isCorrectSubmission(analyticsItem.questionType, mappedOptions)) {
            analyticsItem.correctResponses += 1;
        }
    });

    return finalizeQuestionAnalytics(analytics);
};

export const getQuizLeaderboard = async (quizId, user, limit = 10) => {
    await resolveQuizAndCheckOwner(
        quizId,
        user,
        'Ban khong co quyen xem bang xep hang cua quiz nay'
    );

    const rawAttempts = await getSubmittedAttemptsWithUsersByQuizId(quizId);
    const formattedAttempts = rawAttempts.map(formatAttemptResult);
    const bestAttemptByUserId = new Map();

    formattedAttempts.forEach((attempt) => {
        const currentBest = bestAttemptByUserId.get(attempt.user.id);

        if (isAttemptBetter(attempt, currentBest)) {
            bestAttemptByUserId.set(attempt.user.id, attempt);
        }
    });

    const rankedAttempts = Array.from(bestAttemptByUserId.values())
        .sort(compareLeaderboardEntries)
        .slice(0, limit)
        .map((attempt, index) => ({
            rank: index + 1,
            ...attempt,
        }));

    return {
        totalParticipants: bestAttemptByUserId.size,
        data: rankedAttempts,
    };
};
