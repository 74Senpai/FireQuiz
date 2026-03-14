import express from 'express';
import * as quizController from '../controllers/quizController.js';
import { getIdFromToken, protectedRoute } from '../middlewares/authMiddleware.js'

const router = express.Router();

router.get("/:id", getIdFromToken, quizController.getQuiz);

router.use(protectedRoute);
router.patch("/:id/status", quizController.setStatus);

export default router;
