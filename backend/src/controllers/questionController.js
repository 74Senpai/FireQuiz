import * as questionService from '../services/questionService.js';
import AppError from '../errors/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createQuestion = asyncHandler(async (req, res) => {
  const user = req.user;
  const { content, type, quizId, answers } = req.body;

  if (!content || !type || !quizId) {
    throw new AppError('Không được thiếu content, type, quizId', 400);
  }

  // TEXT không cần answers, các loại khác bắt buộc
  if (type !== 'TEXT' && (!answers || answers.length === 0)) {
    throw new AppError('Câu hỏi trắc nghiệm phải có đáp án', 400);
  }

  const id = await questionService.createQuestion(user, { content, type, quizId, answers: answers || [] });
  return res.status(201).json({ questionId: id });
});


export const changeType = asyncHandler(async (req, res) => {
  const questionId = req.params.id;
  
  const user = req.user;
  
  const { type } = req.body;
  
  await questionService.changeType(questionId, user.id, type);
 
  return res.status(204).send();
});

export const changeContent = asyncHandler(async (req, res) => {
  const questionId = req.params.id;
  
  const user = req.user;

  const { content } = req.body;

  await questionService.changeContent(questionId, user.id, content);

  return res.status(204).send();
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const questionId = req.params.id;

  const user = req.user;

  await questionService.deleteQuestion(questionId, user.id);

  return res.status(204).send();
});

export const getQuestionById = asyncHandler(async (req, res) => {
  const questionId = req.params.id;

  const user = req.user;

  const question = await questionService.getQuestionById(questionId, user);

  return res.status(200).json(question);
});

export const getListQuestionByQuizId = asyncHandler(async (req, res) => {
  const quizId = req.params.quizId;

  const user = req.user;

  const questions = await questionService.getListQuestionByQuizId(quizId, user);

  return res.status(200).json(questions);
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const questionId = req.params.id;
  const user = req.user;
  const data = req.body;

  await questionService.updateQuestion(questionId, user.id, data);

  return res.status(204).send();
});
