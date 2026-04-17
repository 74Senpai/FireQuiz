import { asyncHandler } from '../utils/asyncHandler.js';
import * as quizService from '../services/quizService.js';
import * as quizReportService from '../services/quizReportService.js';
import * as attemptService from '../services/attemptService.js';
import AppError from '../errors/AppError.js';

const sendReport = (res, report) => {
  res.setHeader('Content-Type', report.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
  res.setHeader('Content-Length', String(report.buffer.length));
  return res.status(200).send(report.buffer);
};

export const createQuiz = asyncHandler(async (req, res) => {
  const data = req.body;
  const user = req.user;
  const id = await quizService.createQuiz(user, data);
  return res.status(201).json({ quizId: id });
});

export const getQuiz = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;
  const quiz = await quizService.getQuiz(id, user);
  if (!quiz) throw new AppError('Quiz không tồn tại', 404);
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

export const getResultsDashboard = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;
  const dashboard = await quizService.getResultsDashboard(id, user);
  return res.status(200).json(dashboard);
});

export const exportQuizResultsExcel = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;
  const report = await quizReportService.buildExcelReport(id, user);
  return sendReport(res, report);
});

export const exportQuizResultsPdf = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;
  const report = await quizReportService.buildPdfReport(id, user);
  return sendReport(res, report);
});

export const exportQuizContent = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;
  const { type = 'all', format = 'excel', randomize = 'false', versionCount = '1' } = req.query;

  let report;
  const options = { 
    type, 
    randomize: randomize === 'true', 
    versionCount: parseInt(versionCount) 
  };

  if (format === 'pdf') {
    report = await quizReportService.buildQuizContentPdf(id, user, options);
  } else {
    report = await quizReportService.buildQuizContentExcel(id, user, options);
  }

  return sendReport(res, report);
});

export const setStatus = asyncHandler(async (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const { status } = req.body;

  const VALID_STATUSES = ['DRAFT', 'PUBLIC', 'PRIVATE'];
  if (!status || !VALID_STATUSES.includes(status)) {
    throw new AppError(`Status không hợp lệ. Chỉ chấp nhận: ${VALID_STATUSES.join(', ')}`, 400);
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
  const { gradingScale, timeLimitSeconds, availableFrom, availableUntil, maxAttempts } = req.body;
  await quizService.changeQuizSettings(id, user, { gradingScale, timeLimitSeconds, availableFrom, availableUntil, maxAttempts });
  return res.status(204).send();
});

export const getListQuizByUserId = asyncHandler(async (req, res) => {
  const user = req.user;
  const quizzes = await quizService.getListQuizByUserId(user);
  return res.status(200).json({ data: quizzes });
});

/** GET ?page=&pageSize= — không cần đăng nhập; cập nhật trạng thái theo lịch rồi trả về quiz PUBLIC đang mở. */
export const listPublicOpenQuizzes = asyncHandler(async (req, res) => {
  const result = await quizService.listPublicOpenQuizzes(req.query);
  return res.status(200).json(result);
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;
  await quizService.deleteQuiz(id, user);
  return res.status(204).send();
});

// ─── PIN handlers ────────────────────────────────────────────────────────────

export const generatePin = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;
  const result = await quizService.generatePin(id, user);
  return res.status(200).json(result);
});

export const removePin = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = req.user;
  await quizService.removePin(id, user);
  return res.status(204).send();
});

// Chú thích (BE): Controller xử lý API cho chức năng tham gia Quiz bằng mã PIN
export const joinQuiz = asyncHandler(async (req, res) => {
  const code = req.params.code;
  const user = req.user;
  const quiz = await attemptService.joinQuizByCode(code, user.id);
  
  return res.status(200).json(quiz);
});

export const getPublicQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await quizService.getPublicQuizzes();
  return res.status(200).json({ data: quizzes });
});
