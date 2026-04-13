import express from 'express';
import { uploadMediaFile } from '../controllers/uploadController.js';
import { uploadMedia } from '../middlewares/fileUpload.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Chỉ user đã đăng nhập mới được upload file
router.post('/', protectedRoute, uploadMedia, uploadMediaFile);

export default router;
