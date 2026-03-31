import * as quizRepository from '../repositories/quizRepository.js';
import * as questionRepository from '../repositories/questionRepository.js';
import * as answerRepository from '../repositories/answerRepository.js';
import * as attemptRepository from '../repositories/attemptRepository.js';
import { findById } from '../repositories/userRepository.js';
import AppError from '../errors/AppError.js';

export const createQuiz = async (user, data) => {
  const {
    title,
    description,
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts
  } = data;

  const { id } = user;

  if (!title) {
    throw new AppError("Không thể thiếu tên bộ câu hỏi hoặc người tạo", 400);
  }

  const quizId = await quizRepository.createQuiz({title, description, gradingScale, timeLimitSeconds, availableFrom, availableUntil, maxAttempts, creatorId:id });
  console.log(`info: in quizService.js:22 quizId = ${quizId}`);
  return quizId;
}

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
  const questionsWithAnswers = await Promise.all(
    questions.map(async (question) => {
      const answers = await answerRepository.getAnswersByQuestionId(question.id);
      return {
        ...question,
        answers,
      };
    }),
  );

  return {
    quiz,
    questions: questionsWithAnswers,
  };
};

export const getLeaderboard = async (id, user) => {
  const quiz = await quizRepository.getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  const leaderboard = await attemptRepository.getLeaderboardByQuizId(id);

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

  const analytics = await attemptRepository.getQuestionAnalyticsByQuizId(id);
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

  const dashboard = await attemptRepository.getResultsDashboardByQuizId(id);

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
