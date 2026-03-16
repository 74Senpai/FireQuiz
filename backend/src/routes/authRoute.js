import express from "express";
import * as authController from "../controllers/authController.js";
import * as authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/register", authMiddleware.validateSignUp, authController.signUp);
router.post("/login", authMiddleware.validateLogIn, authController.logIn);
router.post("/logout", authController.logOut);
router.post("/refresh", authController.refreshToken);

export default router;
