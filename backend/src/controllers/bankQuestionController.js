import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../errors/AppError.js';
import * as bankQuestionService from '../services/bankQuestionService.js';

const parseId = (raw, name = 'ID') => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(`${name} không hợp lệ`, 400);
  return id;
};

export const createBankQuestion = asyncHandler(async (req, res) => {
  const { content, type, mediaUrl, difficulty, category, answers } = req.body;
  if (!content || !type) throw new AppError('Thiếu content hoặc type', 400);

  const id = await bankQuestionService.createBankQuestion(req.user, {
    content, type, mediaUrl, difficulty, category, answers: answers || [],
  });
  return res.status(201).json({ bankQuestionId: id });
});

export const getBankQuestions = asyncHandler(async (req, res) => {
  const { category, difficulty, type, search } = req.query;
  const questions = await bankQuestionService.getBankQuestions(req.user, { category, difficulty, type, search });
  return res.json(questions);
});

export const getBankQuestionById = asyncHandler(async (req, res) => {
  const question = await bankQuestionService.getBankQuestionById(req.user, parseId(req.params.id));
  return res.json(question);
});

export const updateBankQuestion = asyncHandler(async (req, res) => {
  const { content, type, mediaUrl, difficulty, category, answers } = req.body;
  await bankQuestionService.updateBankQuestion(req.user, parseId(req.params.id), {
    content, type, mediaUrl, difficulty, category, answers,
  });
  return res.json({ message: 'Cập nhật thành công' });
});

export const deleteBankQuestion = asyncHandler(async (req, res) => {
  await bankQuestionService.deleteBankQuestion(req.user, parseId(req.params.id));
  return res.json({ message: 'Xóa thành công' });
});

export const importFromBank = asyncHandler(async (req, res) => {
  const { questionIds } = req.body;
  if (!questionIds?.length) throw new AppError('Thiếu danh sách questionIds', 400);

  const invalidIds = questionIds.filter((id) => !Number.isInteger(Number(id)) || Number(id) <= 0);
  if (invalidIds.length) throw new AppError(`questionIds không hợp lệ: ${invalidIds.join(', ')}`, 400);

  const { createdIds, skipped } = await bankQuestionService.importFromBank(
    req.user,
    parseId(req.params.quizId, 'quizId'),
    questionIds.map(Number)
  );
  return res.status(201).json({ createdQuestionIds: createdIds, skipped });
});
