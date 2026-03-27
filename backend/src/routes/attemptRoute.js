import express from 'express';
import * as attemptController from '../controllers/attemptController.js';

import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/start/:quizId', protectedRoute, attemptController.startAttempt);

// Chú thích (BE): Route đồng bộ đáp án tạm thời – yêu cầu đăng nhập (protectedRoute đã mount global)
// PATCH /api/attempts/:id/submit
router.patch('/:id/submit', protectedRoute, attemptController.submitAnswer);

export default router;
