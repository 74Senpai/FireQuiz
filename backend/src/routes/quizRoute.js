import express from 'express';
import * as quizController from '../controllers/quizController.js';
import { getIdFromToken, protectedRoute } from '../middlewares/authMiddleware.js'

const router = express.Router();

router.post("/", protectedRoute, quizController.createQuiz);
router.patch("/:id/status", protectedRoute, quizController.setStatus);
router.patch("/:id/info", protectedRoute, quizController.changeQuizInfo);
router.patch("/:id/settings", protectedRoute, quizController.changeQuizSettings);
router.get("/myquiz", protectedRoute, quizController.getListQuizByUserId);
router.get("/:id/preview", protectedRoute, quizController.getQuizPreview);
router.get("/:id/leaderboard", protectedRoute, quizController.getLeaderboard);
router.get("/:id/question-analytics", protectedRoute, quizController.getQuestionAnalytics);
router.get("/:id/export/excel", protectedRoute, quizController.exportQuizResultsExcel);
router.get("/:id/export/pdf", protectedRoute, quizController.exportQuizResultsPdf);
router.delete("/:id", protectedRoute, quizController.deleteQuiz)
router.get("/:id", getIdFromToken, quizController.getQuiz);

export default router;
