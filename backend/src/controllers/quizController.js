import { asyncHandler } from '../untils/asyncHandler.js';
import * as quizService from '../services/quizService.js';
import AppError from '../errors/AppError.js';

export const createQuiz = asyncHandler(async (req, res) => {
  const data = req.body;
  const user = req.user;
  const id = await quizService.createQuiz(user, data);
  return res.status(201).json({quizId:id});
})

export const getQuiz = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;

  const quiz = await quizService.getQuiz(id, user);

  if (!quiz) {
    throw new AppError("Quiz không tồn tại", 404);
  }

  return res.status(200).json(quiz);
});

export const getQuizPreview = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;

  const preview = await quizService.getQuizPreview(id, user);

  return res.status(200).json(preview);
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;

  const leaderboard = await quizService.getLeaderboard(id, user);

  return res.status(200).json(leaderboard);
});

export const getQuestionAnalytics = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;

  const analytics = await quizService.getQuestionAnalytics(id, user);

  return res.status(200).json(analytics);
});

export const setStatus = asyncHandler(async (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const { status } = req.body;
  
  if (!status) {
    throw new AppError("Thiếu status", 400);
  }

  await quizService.setStatus(id, user, status);

  return res.status(204).send();
});

export const changeQuizInfo = asyncHandler(async (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const { title, description } = req.body;

  await quizService.changeQuizInfo(id, user, { title, description });

  return res.status(204).send();
});

export const changeQuizSettings = asyncHandler(async (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const {  
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts
  } = req.body;
  
  await quizService.changeQuizSettings(id, user, { gradingScale, timeLimitSeconds, availableFrom, availableUntil, maxAttempts });

  return res.status(204).send();
});

export const getListQuizByUserId = asyncHandler(async (req, res) => {
  const user = req.user;

  const quizzes = await quizService.getListQuizByUserId(user);

  return res.status(200).json({data: quizzes});
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;

  await quizService.deleteQuiz(id, user);

  return res.status(204).send();
});
