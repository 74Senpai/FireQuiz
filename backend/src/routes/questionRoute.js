import express from 'express';
import * as authMiddleware from '../middlewares/authMiddleware.js';
import * as questionController from '../controllers/questionController.js';

const router = express.Router();


router.use(authMiddleware.getIdFromToken);
router.get("/:quizId/list", questionController.getListQuestionByQuizId);
router.get("/:id", questionController.getQuestionById);


router.use(authMiddleware.protectedRoute);
router.post("/", questionController.createQuestion);
router.patch("/:id", questionController.updateQuestion);
router.delete("/:id", questionController.deleteQuestion);

export default router;
