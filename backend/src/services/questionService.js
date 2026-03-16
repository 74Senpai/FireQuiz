import * as questionRepository from '../repositories/questionRepository.js';
import { getQuizById } from '../repositories/quizRepository.js';
import AppError from '../errors/AppError.js';

const checkType = (type) => {
  const allowedTypes = ['MULTI_ANSWERS', 'ANANSWER', 'TEXT'];

  if (!allowedTypes.includes(type)) {
    throw new AppError("Loại câu hỏi không hợp lệ", 400);
  }
}

export const createQuestion = async (user, data) => {
  const { content, type, quizId } = data;
  checkType(type);
  console.log(`info: in questionService.js:16 content: ${content}, type: ${type}, quizId: ${quizId}`);
  const id = await questionRepository.create({ content, type, quizId});
  return id;
};

const checkQuestionExistAndOwner = async (questionId, userId) => {
  const question = await questionRepository.findQuestionById(questionId);

  if (!question) {
    throw new AppError("Câu hỏi không tồn tại", 400);
  }

  const quiz = await getQuizById(question.quiz_id);

  if (!quiz) {
    throw new AppError("Câu hỏi không tồn tại", 400);
  }
  
  console.log(`info: in questionService.js:34 quiz.creator_id: ${quiz.creator_id}, userId: ${userId}`);

  if (quiz.creator_id != userId) {
    throw new AppError("Bạn không có quyền thực hiện hành động này", 403);
  }
};

export const changeType = async (questionId, userId, type) => {  
  await checkQuestionExistAndOwner(questionId, userId);

  if (type) {
    checkType(type);
  } else {
    return;
  }

  await questionRepository.changeType(questionId, type);
};

export const changeContent = async (questionId, userId, content) => {
  await checkQuestionExistAndOwner(questionId, userId);

  await questionRepository.changeContent(questionId, content);
};

export const updateQuestion = async (questionId, userId, data) => {
  const { type, content } = data;
  await changeType(questionId, userId, type);
  await changeContent(questionId, userId, content);
}

export const deleteQuestion = async (questionId, userId) => {
  await checkQuestionExistAndOwner(questionId, userId);

  await questionRepository.deleteQuestionById(questionId);
};

const checkQuizAccess = (quiz, user) => {
  const isOwner = user && user.id === quiz.creator_id;

  if (!isOwner && (quiz.status === "DRAFT" || quiz.status === "PRIVATE")) {
    throw new AppError("Quiz không tồn tại hoặc bạn không có quyền truy cập", 403);
  }
};

export const getQuestionById = async (questionId, user) => {
  const question = await questionRepository.findQuestionById(questionId);

  if (!question) {
    throw new AppError("Question không tồn tại", 404);
  }

  const quiz = await getQuizById(question.quiz_id);

  checkQuizAccess(quiz, user);

  return question;
};

export const getListQuestionByQuizId = async (quizId, user) => {
  const quiz = await getQuizById(quizId);

  if (!quiz) {
    throw new AppError("Quiz không tồn tại", 404);
  }

  checkQuizAccess(quiz, user);

  const questions = await questionRepository.getListQuestionByQuizId(quizId);

  return questions;
};
