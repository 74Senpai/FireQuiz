import pool from '../db/db.js';
import logger from '../utils/logger.js';
import * as quizRepository from '../repositories/quizRepository.js';
import * as questionRepository from '../repositories/questionRepository.js';
import * as answerRepository from '../repositories/answerRepository.js';
import * as attemptAggregationService from '../services/attemptAggregationService.js';
import { findById } from '../repositories/userRepository.js';
import AppError from '../errors/AppError.js';
import { deleteFileFromSupabase } from './supabaseService.js';
import * as mediaService from './mediaService.js';

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
    maxAttempts,
    maxTabViolations,
    maxAttemptsPerUser
  } = data;

  const { id } = user;

  if (!title) {
    throw new AppError("Không thể thiếu tên bộ câu hỏi hoặc người tạo", 400);
  }

  const quizId = await quizRepository.createQuiz({title, description, gradingScale, timeLimitSeconds, availableFrom, availableUntil, maxAttempts, maxTabViolations, maxAttemptsPerUser, creatorId:id });
  logger.info(`quizService.js - Created quiz with ID: ${quizId}`);
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

  return await mediaService.hydrateQuiz(quiz);
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
    quiz: await mediaService.hydrateQuiz(quiz),
    questions: await mediaService.hydrateQuestions(questionsWithAnswers),
  };
};

export const getLeaderboard = async (id, user) => {
  const quiz = await quizRepository.getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  const leaderboard = await attemptAggregationService.getLeaderboardDataByQuizId(id);

  return {
    quiz: await mediaService.hydrateQuiz({
      id: quiz.id,
      title: quiz.title,
      status: quiz.status,
      gradingScale: quiz.grading_scale,
      thumbnail_url: quiz.thumbnail_url
    }),
    data: leaderboard,
  };
};

export const getQuestionAnalytics = async (id, user) => {
  const quiz = await quizRepository.getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  const analytics = await attemptAggregationService.getQuestionAnalyticsDataByQuizId(id);
  const totalAttempts = analytics[0]?.total_attempts || 0;

  return {
    quiz: await mediaService.hydrateQuiz({
      id: quiz.id,
      title: quiz.title,
      status: quiz.status,
      gradingScale: quiz.grading_scale,
      thumbnail_url: quiz.thumbnail_url
    }),
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

  let totalCorrect = 0;
  let totalIncorrect = 0;

  const gradingScale = Number(quiz.grading_scale || 10);
  const bucketSize = gradingScale / 10;
  const scoreHistogram = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * bucketSize}-${(i + 1) * bucketSize}`,
    count: 0,
  }));

  dashboard.forEach(item => {
    totalCorrect += item.correct_count || 0;
    totalIncorrect += item.incorrect_count || 0;

    if (item.score !== null && item.score !== undefined) {
      const score = Number(item.score);
      let index = Math.floor((score / gradingScale) * 10);
      if (index >= 10) index = 9;
      if (index < 0) index = 0;
      scoreHistogram[index].count++;
    }
  });

  const totalQuestionsAnswered = totalCorrect + totalIncorrect;
  const correctRate = totalQuestionsAnswered > 0 ? ((totalCorrect / totalQuestionsAnswered) * 100).toFixed(1) : 0;
  const incorrectRate = totalQuestionsAnswered > 0 ? ((totalIncorrect / totalQuestionsAnswered) * 100).toFixed(1) : 0;

  return {
    quiz: await mediaService.hydrateQuiz({
      id: quiz.id,
      title: quiz.title,
      status: quiz.status,
      gradingScale: quiz.grading_scale,
      thumbnail_url: quiz.thumbnail_url
    }),
    summary: {
      totalParticipants: dashboard.length,
      submittedCount: dashboard.filter(
        (item) => item.submission_status === "SUBMITTED",
      ).length,
      inProgressCount: dashboard.filter(
        (item) => item.submission_status === "IN_PROGRESS",
      ).length,
      overallRatio: {
        correct: totalCorrect,
        incorrect: totalIncorrect,
        correctRate: Number(correctRate),
        incorrectRate: Number(incorrectRate)
      },
      scoreHistogram,
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
  const quiz = await quizRepository.getQuizById(id);
  checkQuizExistAndOwner(quiz, user);

  const oldThumbnailUrl = quiz?.thumbnail_url;
  await quizRepository.updateQuizInfo(id, info);

  // Xóa thumbnail cũ nếu bị thay đổi hoặc gỡ bỏ
  if (info.thumbnailUrl !== undefined && oldThumbnailUrl && oldThumbnailUrl !== info.thumbnailUrl) {
    await deleteFileFromSupabase(oldThumbnailUrl);
  }
};

export const changeQuizSettings = async(id, user, settings) => {
  const {  
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts,
    maxTabViolations,
    maxAttemptsPerUser
  } = settings;

  const quiz = await quizRepository.getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  await quizRepository.updateQuizSettings(id, settings);
};

export const getListQuizByUserId = async (user) => {
  const quizzes = await quizRepository.getListQuizByUserId(user.id);
  return await mediaService.hydrateQuizzes(quizzes);
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

  const data = await mediaService.hydrateQuizzes(
    rows.map(({ quiz_code: _omit, joined_count, ...rest }) => ({
      ...rest,
      joinedCount: Number(joined_count) || 0
    }))
  );

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
  const thumbnailUrl = quiz?.thumbnail_url;

  try {
    await quizRepository.hardDelete(id);
    // Nếu hard delete thành công, nỗ lực xóa thumbnail
    if (thumbnailUrl) {
      await deleteFileFromSupabase(thumbnailUrl);
    }
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




export const getPublicQuizzes = async () => {
  const quizzes = await quizRepository.getPublicQuizzes();
  return await mediaService.hydrateQuizzes(quizzes);
};
