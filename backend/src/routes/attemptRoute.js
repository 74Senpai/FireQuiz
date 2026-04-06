import express from 'express';
import * as attemptController from '../controllers/attemptController.js';

const router = express.Router();

router.get('/my', attemptController.listMyAttempts);
router.get('/:id/review', attemptController.getAttemptReview);

export default router;
