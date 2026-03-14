import * as quizRepository from '../repositories/quizRepository.js';
import AppError from '../errors/AppError.js';

export const getQuiz = async (id, user) => {
  const quiz = await quizRepository.getQuizById(id);

  if (!quiz) {
    throw new AppError("Quiz không tồn tại", 404);
  }

  if (quiz.status !== "PUBLIC") {
    if (!user || user.id !== quiz.creator_id) {
      throw new AppError("Quiz không tồn tại", 404);
    }
  }

  return quiz;
};

export const getQuizPreview = async (id, user) => {
  const quiz = await quizRepository.getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  const questions = await questionRepository.getListQuestionByQuizId(id);
  const answers = await answerRepository.getAnswersByQuestionIds(
    questions.map((question) => question.id),
  );
  const answersByQuestionId = buildAnswersByQuestionIdMap(answers);
  const questionsWithAnswers = questions.map((question) => ({
    ...question,
    answers: answersByQuestionId.get(question.id) || [],
  }));

  return {
    quiz,
    questions: questionsWithAnswers,
  };
};

export const getLeaderboard = async (id, user) => {
  const quiz = await quizRepository.getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  const leaderboard = await attemptAggregationService.getLeaderboardDataByQuizId(id);

  return {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      status: quiz.status,
      gradingScale: quiz.grading_scale,
    },
    data: leaderboard,
  };
};

export const getQuestionAnalytics = async (id, user) => {
  const quiz = await quizRepository.getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  const analytics = await attemptAggregationService.getQuestionAnalyticsDataByQuizId(id);
  const totalAttempts = analytics[0]?.total_attempts || 0;

  return {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      status: quiz.status,
      gradingScale: quiz.grading_scale,
    },
    summary: {
      totalAttempts,
      totalQuestions: analytics.length,
    },
    data: analytics,
  };
};

export const getResultsDashboard = async (id, user) => {
  const quiz = await quizRepository.getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  const dashboard = await attemptAggregationService.getResultsDashboardDataByQuizId(id);

  return {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      status: quiz.status,
      gradingScale: quiz.grading_scale,
    },
    summary: {
      totalParticipants: dashboard.length,
      submittedCount: dashboard.filter(
        (item) => item.submission_status === "SUBMITTED",
      ).length,
      inProgressCount: dashboard.filter(
        (item) => item.submission_status === "IN_PROGRESS",
      ).length,
    },
    data: dashboard,
  };
};

const checkQuizExistAndOwner = (quiz, user) => {
  if (!quiz) {
    throw new AppError("Quiz không tồn tại", 404);
  }
  
  if (user.id != quiz.creator_id) {
    throw new AppError("Bạn không có quyền thực hiện hành động này", 403);
  }
};

export const setStatus = async (id, user, status) => {
  const quiz = await quizRepository.getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  await quizRepository.setStatus(id, status);
};

export const changeQuizInfo = async (id, user, info) => {
  const { title, description } = info;
  
  const quiz = await quizRepository.getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  await quizRepository.updateQuizInfo(id, info);
};

export const changeQuizSettings = async(id, user, settings) => {
  const {  
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts
  } = settings;

  const quiz = await quizRepository.getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  await quizRepository.updateQuizSettings(id, settings);
};

export const getListQuizByUserId = async (user) => {
  const quizzes = await quizRepository.getListQuizByUserId(user.id);
  return quizzes;
};

export const deleteQuiz = async (id, user) => {
  const quiz = await quizRepository.getQuizById(id);
  
  checkQuizExistAndOwner(quiz, user);

  try {
    await quizRepository.hardDelete(id);
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      await quizRepository.softDelete(id);
    } else {
      throw new AppError("Xóa bộ câu hỏi thất bại", 404);
    }
  }
}
