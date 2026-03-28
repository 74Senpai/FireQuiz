import {
  createQuiz as createQuizRecord,
  getListQuizByUserId as getListQuizByCreatorId,
  getQuizById,
  hardDelete,
  setStatus as setQuizStatus,
  softDelete,
  updateQuizInfo,
  updateQuizSettings,
} from '../repositories/quizRepository.js';
import { getListQuestionByQuizId } from './questionService.js';
import AppError from '../errors/AppError.js';

const ALLOWED_QUIZ_STATUSES = ['DRAFT', 'PUBLIC', 'CLOSED'];

const normalizeQuizStatus = (status) => {
  if (!status) {
    return 'DRAFT';
  }

  if (!ALLOWED_QUIZ_STATUSES.includes(status)) {
    throw new AppError('Status quiz khong hop le', 400);
  }

  return status;
};

export const createQuiz = async (user, data) => {
  const {
    title,
    description,
    status,
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

  const quizId = await createQuizRecord({
    title,
    description,
    status: normalizeQuizStatus(status),
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts,
    creatorId: id
  });
  console.log(`info: in quizService.js:22 quizId = ${quizId}`);
  return quizId;
}

export const getQuiz = async (id, user) => {
  const quiz = await getQuizById(id);

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
  if (!user) {
    throw new AppError("Ban khong co quyen xem truoc quiz nay", 401);
  }

  const quiz = await getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  const questions = await getListQuestionByQuizId(id, user);

  return {
    quiz,
    questions,
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
  const quiz = await getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  await setQuizStatus(id, normalizeQuizStatus(status));
};

export const changeQuizInfo = async (id, user, info) => {
  const { title, description } = info;
  
  const quiz = await getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  await updateQuizInfo(id, info);
};

export const changeQuizSettings = async(id, user, settings) => {
  const {  
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts
  } = settings;

  const quiz = await getQuizById(id);

  checkQuizExistAndOwner(quiz, user);

  await updateQuizSettings(id, settings);
};

export const getListQuizByUserId = async (user) => {
  const quizzes = await getListQuizByCreatorId(user.id);
  return quizzes;
};

export const deleteQuiz = async (id, user) => {
  const quiz = await getQuizById(id);
  
  checkQuizExistAndOwner(quiz, user);

  try {
      await hardDelete(id);
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      await softDelete(id);
    } else {
      throw new AppError("Xóa bộ câu hỏi thất bại", 404);
    }
  }
}
