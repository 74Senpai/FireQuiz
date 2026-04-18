import express from "express";
import * as authController from "../controllers/authController.js";
import * as authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/register", authMiddleware.validateSignUp, authController.signUp);
router.post("/login", authMiddleware.validateLogIn, authController.logIn);
router.post("/logout", authController.logOut);
router.post("/refresh", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyForgotPasswordOTP);
router.post("/reset-password", authController.resetPassword);
router.put("/change-password", authMiddleware.protectedRoute, authController.changePassword);

export default router;

