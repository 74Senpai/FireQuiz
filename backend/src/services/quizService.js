import pool from '../db/db.js';
import * as quizRepository from '../repositories/quizRepository.js';
import * as questionRepository from '../repositories/questionRepository.js';
import * as answerRepository from '../repositories/answerRepository.js';
import * as attemptAggregationService from '../services/attemptAggregationService.js';
import { findById } from '../repositories/userRepository.js';
import AppError from '../errors/AppError.js';

const PIN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const PIN_LENGTH = 6;
const PIN_MAX_RETRIES = 5;
import crypto from 'crypto';


const buildAnswersByQuestionIdMap = (answers) =>
  answers.reduce((acc, answer) => {
    if (!acc.has(answer.question_id)) {
      acc.set(answer.question_id, []);
    }

    acc.get(answer.question_id).push(answer);
    return acc;
  }, new Map());

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

/**
 * Danh sách quiz PUBLIC đang trong giờ mở.
 * Nghiệp vụ: mở theo lịch (non-PUBLIC trong cửa sổ → PUBLIC), đóng khi quá available_until,
 * rồi đếm + phân trang — toàn bộ trong một transaction.
 */
export const listPublicOpenQuizzes = async (query) => {
  const page = Math.max(1, parseInt(String(query.page), 10) || 1);
  const rawSize = parseInt(String(query.pageSize), 10);
  const pageSize = Number.isFinite(rawSize)
    ? Math.min(100, Math.max(1, rawSize))
    : 10;

  const offset = (page - 1) * pageSize;
  const conn = await pool.getConnection();

  let rows;
  let total;
  try {
    await conn.beginTransaction();
    await quizRepository.updatePromoteToPublicBySchedule(conn);
    await quizRepository.updateDemotePublicPastAvailableUntil(conn);
    total = await quizRepository.countPublicOpenQuizzes(conn);
    rows = await quizRepository.findPublicOpenQuizzes(conn, {
      limit: pageSize,
      offset,
    });
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const data = rows.map(({ quiz_code: _omit, ...rest }) => rest);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    },
  };
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
};


/**
 * Sinh mã PIN ngẫu nhiên 6 ký tự (A-Z, 0-9)
 * Nếu quiz đã có mã, trả về mã hiện tại (idempotent)
 */
const generateRandomPin = (length = PIN_LENGTH) => {
  let pin = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    pin += PIN_CHARS[bytes[i] % PIN_CHARS.length];
  }
  return pin;
};

export const generatePin = async (id, user) => {
  const quiz = await quizRepository.getQuizById(id);
  checkQuizExistAndOwner(quiz, user);

  // Idempotent: trả về mã hiện tại nếu đã có
  if (quiz.quiz_code) {
    return { pin: quiz.quiz_code };
  }

  // Sinh mã mới, kiểm tra trùng lặp
  let pin = null;
  for (let attempt = 0; attempt < PIN_MAX_RETRIES; attempt++) {
    const candidate = generateRandomPin();
    const existing = await quizRepository.findByQuizCode(candidate);
    if (!existing) {
      pin = candidate;
      break;
    }
  }

  if (!pin) {
    throw new AppError('Không thể sinh mã PIN duy nhất, vui lòng thử lại', 500);
  }

  await quizRepository.setQuizCode(id, pin);
  return { pin };
};

export const removePin = async (id, user) => {
  const quiz = await quizRepository.getQuizById(id);
  checkQuizExistAndOwner(quiz, user);

  await quizRepository.setQuizCode(id, null);
};

