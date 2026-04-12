import express from 'express';
import { uploadMediaFile, deleteMediaFile } from '../controllers/uploadController.js';
import { uploadMedia } from '../middlewares/fileUpload.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Chỉ user đã đăng nhập mới được upload/delete file
router.post('/', protectedRoute, uploadMedia, uploadMediaFile);
router.delete('/', protectedRoute, deleteMediaFile);

export default router;
