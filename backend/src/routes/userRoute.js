import express from 'express';
import * as userController from '../controllers/userController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/me", protectedRoute, userController.getMyInfo);
router.put("/avatar", protectedRoute, userController.updateAvatar);
router.put("/profile", protectedRoute, userController.updateProfile);

export default router;

