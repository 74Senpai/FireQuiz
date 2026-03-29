import express from 'express';
import * as attemptController from '../controllers/attemptController.js';


router.get('/my', attemptController.listMyAttempts);
router.get('/:id/review', attemptController.getAttemptReview);
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/start/:quizId', attemptController.startAttempt);

// Chú thích (BE): Route đồng bộ đáp án tạm thời – auto-save
// PATCH /api/attempts/:id/answer
router.patch('/:id/answer', protectedRoute, attemptController.submitAnswer);

// Chú thích (BE): Route khi người dùng vi phạm chuyển tab
// PATCH /api/attempts/:id/violation
router.patch('/:id/violation', protectedRoute, attemptController.reportViolation);

// Chú thích (BE): Route nộp bài chính thức (tự động hoặc người dùng nhấn), khóa bài & chấm điểm
// PATCH /api/attempts/:id/submit
router.patch('/:id/submit', attemptController.submitAnswer);

export default router;
