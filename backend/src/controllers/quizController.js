import { asyncHandler } from '../untils/asyncHandler.js';
import * as quizService from '../services/quizService.js';

export const getQuiz = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const user = req.user;

  const quiz = await quizService.getQuiz(id, user);

  if (!quiz) {
    throw new AppError("Quiz không tồn tại", 404);
  }

  return res.status(200).json(quiz);
});

export const setStatus = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const id = req.params.id;
  const { status } = req.body;
  
  if (!status) {
    throw new AppError("Thiếu status", 400);
  }

  await quizService.setStatus(id, user, status);

  return res.status(204).send();
});

