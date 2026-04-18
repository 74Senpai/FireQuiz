import { Router } from 'express';
import * as bankQuestionController from '../controllers/bankQuestionController.js';

const router = Router();

// Tất cả route bank đều yêu cầu đăng nhập (protectedRoute áp dụng ở app.js)
router.get('/', bankQuestionController.getBankQuestions);
router.post('/', bankQuestionController.createBankQuestion);
router.get('/:id', bankQuestionController.getBankQuestionById);
router.patch('/:id', bankQuestionController.updateBankQuestion);
router.delete('/:id', bankQuestionController.deleteBankQuestion);

// Import từ bank vào quiz
router.post('/import/:quizId', bankQuestionController.importFromBank);

export default router;
