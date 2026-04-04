import express from 'express';
import * as quizController from '../controllers/quizController.js';
import * as importController from '../controllers/importController.js';
import { getIdFromToken, protectedRoute } from '../middlewares/authMiddleware.js';
import { uploadExcel } from '../middlewares/fileUpload.js';

const router = express.Router();

// !! Route cụ thể phải đứng TRƯỚC route dynamic /:id !!

// Route không có :id — phải đứng TRƯỚC
router.get('/myquiz', protectedRoute, quizController.getListQuizByUserId);
router.post('/', protectedRoute, quizController.createQuiz);

// Routes có :id — CRUD
router.patch('/:id/status', protectedRoute, quizController.setStatus);
router.patch('/:id/info', protectedRoute, quizController.changeQuizInfo);
router.patch('/:id/settings', protectedRoute, quizController.changeQuizSettings);
router.delete('/:id', protectedRoute, quizController.deleteQuiz);

// Routes có :id — Data
router.get('/:id/preview', protectedRoute, quizController.getQuizPreview);
router.get('/:id/leaderboard', protectedRoute, quizController.getLeaderboard);
router.get('/:id/question-analytics', protectedRoute, quizController.getQuestionAnalytics);
router.get('/:id/results-dashboard', protectedRoute, quizController.getResultsDashboard);

// Routes có :id — Export
router.get('/:id/export/excel', protectedRoute, quizController.exportQuizResultsExcel);
router.get('/:id/export/pdf', protectedRoute, quizController.exportQuizResultsPdf);

// Routes có :id — PIN
router.post('/:id/generate-pin', protectedRoute, quizController.generatePin);
router.delete('/:id/pin', protectedRoute, quizController.removePin);

// Routes có :id — Import Excel
router.get('/:id/import-excel/template', protectedRoute, importController.downloadTemplate);
router.post('/:id/import-excel', protectedRoute, uploadExcel, importController.importQuestionsFromExcel);

// Route GET /:id — phải ở CUỐI để không conflict
router.get('/:id', getIdFromToken, quizController.getQuiz);

export default router;
