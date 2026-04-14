import * as attemptRepository from '../repositories/attemptRepository.js';
import * as questionRepository from '../repositories/questionRepository.js';
import * as userRepository from '../repositories/userRepository.js';

const compareAttemptsByPerformance = (a, b) => {
  const scoreA = Number(a.score ?? -1);
  const scoreB = Number(b.score ?? -1);

  if (scoreB !== scoreA) {
    return scoreB - scoreA;
  }

  const durationA = a.duration_seconds ?? Number.MAX_SAFE_INTEGER;
  const durationB = b.duration_seconds ?? Number.MAX_SAFE_INTEGER;

  if (durationA !== durationB) {
    return durationA - durationB;
  }

  const finishedAtA = a.finished_at ? new Date(a.finished_at).getTime() : Number.MAX_SAFE_INTEGER;
  const finishedAtB = b.finished_at ? new Date(b.finished_at).getTime() : Number.MAX_SAFE_INTEGER;

  if (finishedAtA !== finishedAtB) {
    return finishedAtA - finishedAtB;
  }

  return a.id - b.id;
};

const compareDashboardRows = (a, b) => {
  if (a.finished_at === null && b.finished_at !== null) {
    return 1;
  }

  if (a.finished_at !== null && b.finished_at === null) {
    return -1;
  }

  return compareAttemptsByPerformance(a, b);
};

const buildUserMap = async (userIds) => {
  const users = await userRepository.findActiveUsersByIds(userIds);
  return new Map(users.map((user) => [user.id, user]));
};

const buildAttemptCountMap = (rows) => {
  return new Map(rows.map((row) => [row.user_id, row.total_attempts]));
};

const loadAttemptQuestionBundle = async (attemptIds) => {
  if (!attemptIds.length) {
    return {
      attemptQuestions: [],
      optionsByQuestionId: new Map(),
      selectedOptionIds: new Set(),
    };
  }

  const attemptQuestions = await attemptRepository.getAttemptQuestionsByAttemptIds(attemptIds);

  if (!attemptQuestions.length) {
    return {
      attemptQuestions,
      optionsByQuestionId: new Map(),
      selectedOptionIds: new Set(),
    };
  }

  const questionIds = attemptQuestions.map((question) => question.id);
  const attemptOptions = await attemptRepository.getAttemptOptionsByQuestionIds(questionIds);
  const optionIds = attemptOptions.map((option) => option.id);
  const attemptAnswers = optionIds.length
    ? await attemptRepository.getAttemptAnswersByOptionIds(optionIds)
    : [];

  const selectedOptionIds = new Set(
    attemptAnswers.map((answer) => answer.attempt_option_id),
  );

  const optionsByQuestionId = attemptOptions.reduce((acc, option) => {
    if (!acc.has(option.attempt_question_id)) {
      acc.set(option.attempt_question_id, []);
    }

    acc.get(option.attempt_question_id).push(option);
    return acc;
  }, new Map());

  return {
    attemptQuestions,
    optionsByQuestionId,
    selectedOptionIds,
  };
};

const buildAttemptQuestionEvaluationList = async (attemptIds) => {
  const { attemptQuestions, optionsByQuestionId, selectedOptionIds } =
    await loadAttemptQuestionBundle(attemptIds);

  return attemptQuestions.map((question) => {
    const questionOptions = optionsByQuestionId.get(question.id) || [];
    const totalCorrectOptions = questionOptions.filter((option) => option.is_correct).length;
    const selectedCorrectOptions = questionOptions.filter(
      (option) => option.is_correct && selectedOptionIds.has(option.id),
    ).length;
    const selectedIncorrectOptions = questionOptions.filter(
      (option) => !option.is_correct && selectedOptionIds.has(option.id),
    ).length;
    const hasResponse = questionOptions.some((option) => selectedOptionIds.has(option.id));
    const isCorrect =
      totalCorrectOptions > 0 &&
      selectedIncorrectOptions === 0 &&
      selectedCorrectOptions === totalCorrectOptions;

    return {
      attempt_id: question.quiz_attempt_id,
      content: question.content,
      type: question.type,
      has_response: hasResponse,
      is_correct: isCorrect,
    };
  });
};

const buildAttemptSummaryMap = (attemptIds, questionEvaluations) => {
  const summaryMap = new Map(
    attemptIds.map((attemptId) => [
      attemptId,
      { correct_count: 0, incorrect_count: 0 },
    ]),
  );

  questionEvaluations.forEach((evaluation) => {
    const current = summaryMap.get(evaluation.attempt_id) || {
      correct_count: 0,
      incorrect_count: 0,
    };

    summaryMap.set(evaluation.attempt_id, {
      correct_count: current.correct_count + (evaluation.is_correct ? 1 : 0),
      incorrect_count: current.incorrect_count + (evaluation.is_correct ? 0 : 1),
    });
  });

  return summaryMap;
};

export const getLeaderboardDataByQuizId = async (quizId) => {
  const finishedAttempts = await attemptRepository.getFinishedAttemptsByQuizId(quizId);

  if (!finishedAttempts.length) {
    return [];
  }

  const userMap = await buildUserMap(
    [...new Set(finishedAttempts.map((attempt) => attempt.user_id))],
  );

  const bestAttemptByUserId = new Map();

  finishedAttempts.forEach((attempt) => {
    if (!userMap.has(attempt.user_id)) {
      return;
    }

    const currentBest = bestAttemptByUserId.get(attempt.user_id);

    if (!currentBest || compareAttemptsByPerformance(attempt, currentBest) < 0) {
      bestAttemptByUserId.set(attempt.user_id, attempt);
    }
  });

  return [...bestAttemptByUserId.values()]
    .sort(compareAttemptsByPerformance)
    .slice(0, 10)
    .map((attempt) => {
      const user = userMap.get(attempt.user_id);

      return {
        user_id: attempt.user_id,
        full_name: user.full_name,
        email: user.email,
        score: attempt.score,
        started_at: attempt.started_at,
        finished_at: attempt.finished_at,
        duration_seconds: attempt.duration_seconds,
      };
    });
};

export const getQuestionAnalyticsDataByQuizId = async (quizId) => {
  const [questions, finishedAttempts] = await Promise.all([
    questionRepository.getListQuestionByQuizId(quizId),
    attemptRepository.getFinishedAttemptsByQuizId(quizId),
  ]);

  const totalAttempts = finishedAttempts.length;
  const questionEvaluations = await buildAttemptQuestionEvaluationList(
    finishedAttempts.map((attempt) => attempt.id),
  );

  const analyticsByQuestionContent = questionEvaluations.reduce((acc, evaluation) => {
    if (!acc.has(evaluation.content)) {
      acc.set(evaluation.content, {
        total_responses: 0,
        correct_responses: 0,
      });
    }

    if (evaluation.has_response) {
      const current = acc.get(evaluation.content);
      current.total_responses += 1;
      current.correct_responses += evaluation.is_correct ? 1 : 0;
    }

    return acc;
  }, new Map());

  return questions.map((question) => {
    const questionStats = analyticsByQuestionContent.get(question.content) || {
      total_responses: 0,
      correct_responses: 0,
    };

    const incorrectResponses =
      questionStats.total_responses - questionStats.correct_responses;

    return {
      id: question.id,
      content: question.content,
      type: question.type,
      total_attempts: totalAttempts,
      total_responses: questionStats.total_responses,
      correct_responses: questionStats.correct_responses,
      incorrect_responses: incorrectResponses,
      correct_rate:
        totalAttempts === 0
          ? 0
          : Number(
              ((questionStats.correct_responses * 100) / totalAttempts).toFixed(2),
            ),
      incorrect_rate:
        totalAttempts === 0
          ? 0
          : Number(((incorrectResponses * 100) / totalAttempts).toFixed(2)),
      response_rate:
        totalAttempts === 0
          ? 0
          : Number(
              ((questionStats.total_responses * 100) / totalAttempts).toFixed(2),
            ),
    };
  });
};

export const getResultReportDataByQuizId = async (quizId) => {
  const finishedAttempts = await attemptRepository.getFinishedAttemptsByQuizId(quizId);

  if (!finishedAttempts.length) {
    return [];
  }

  const userMap = await buildUserMap(
    [...new Set(finishedAttempts.map((attempt) => attempt.user_id))],
  );
  const questionEvaluations = await buildAttemptQuestionEvaluationList(
    finishedAttempts.map((attempt) => attempt.id),
  );
  const attemptSummaryMap = buildAttemptSummaryMap(
    finishedAttempts.map((attempt) => attempt.id),
    questionEvaluations,
  );

  return finishedAttempts
    .filter((attempt) => userMap.has(attempt.user_id))
    .sort(compareAttemptsByPerformance)
    .map((attempt) => {
      const user = userMap.get(attempt.user_id);
      const attemptSummary = attemptSummaryMap.get(attempt.id) || {
        correct_count: 0,
        incorrect_count: 0,
      };

      return {
        attempt_id: attempt.id,
        user_id: attempt.user_id,
        full_name: user.full_name,
        email: user.email,
        score: attempt.score,
        started_at: attempt.started_at,
        finished_at: attempt.finished_at,
        duration_seconds: attempt.duration_seconds,
        tab_violations: attempt.tab_violations || 0,
        correct_count: attemptSummary.correct_count,
        incorrect_count: attemptSummary.incorrect_count,
      };
    });
};

export const getResultsDashboardDataByQuizId = async (quizId) => {
  const [latestAttempts, attemptCountRows] = await Promise.all([
    attemptRepository.getLatestAttemptsByQuizId(quizId),
    attemptRepository.getUserAttemptCountsByQuizId(quizId),
  ]);

  if (!latestAttempts.length) {
    return [];
  }

  const userMap = await buildUserMap(
    [...new Set(latestAttempts.map((attempt) => attempt.user_id))],
  );
  const attemptCountMap = buildAttemptCountMap(attemptCountRows);
  const questionEvaluations = await buildAttemptQuestionEvaluationList(
    latestAttempts.map((attempt) => attempt.id),
  );
  const attemptSummaryMap = buildAttemptSummaryMap(
    latestAttempts.map((attempt) => attempt.id),
    questionEvaluations,
  );

  return latestAttempts
    .filter((attempt) => userMap.has(attempt.user_id))
    .sort(compareDashboardRows)
    .map((attempt) => {
      const user = userMap.get(attempt.user_id);
      const attemptSummary = attemptSummaryMap.get(attempt.id) || {
        correct_count: 0,
        incorrect_count: 0,
      };

      return {
        attempt_id: attempt.id,
        user_id: attempt.user_id,
        full_name: user.full_name,
        email: user.email,
        score: attempt.score,
        started_at: attempt.started_at,
        finished_at: attempt.finished_at,
        duration_seconds: attempt.duration_seconds,
        tab_violations: attempt.tab_violations || 0,
        submission_status: attempt.finished_at === null ? "IN_PROGRESS" : "SUBMITTED",
        total_attempts: attemptCountMap.get(attempt.user_id) || 0,
        correct_count: attemptSummary.correct_count,
        incorrect_count: attemptSummary.incorrect_count,
      };
    });
};
