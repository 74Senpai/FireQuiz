import * as quizRepository from '../repositories/quizRepository.js';
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

export const joinQuiz = async (code) => {
  // Chú thích (BE): Lấy quiz dựa trên mã PIN (code)
  const quiz = await quizRepository.getQuizByCode(code);

  // Chú thích (BE): Xử lý lỗi "Sai PIN" nếu không tìm thấy quiz
  if (!quiz) {
    throw new AppError("Sai PIN", 404);
  }

  // Chú thích (BE): Xử lý lỗi "Quiz đã đóng" dựa vào status
  if (quiz.status === 'CLOSED') {
    throw new AppError("Quiz đã đóng", 403);
  }

  // Chú thích (BE): Xử lý lỗi "Quiz đã đóng" dựa vào thời gian kết thúc (available_until)
  const now = new Date();
  if (quiz.available_until && new Date(quiz.available_until) < now) {
    throw new AppError("Quiz đã đóng", 403);
  }

  // Chú thích (BE): Xử lý lỗi "Quiz không công khai" nếu status không phải PUBLIC
  if (quiz.status !== 'PUBLIC') {
    throw new AppError("Quiz không công khai", 403);
  }

  return quiz;
};

export const getPublicQuizzes = async () => {
  return await quizRepository.getPublicQuizzes();
};
