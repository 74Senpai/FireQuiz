import express from 'express';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.get("/me", userController.getMyInfo);

export default router;
