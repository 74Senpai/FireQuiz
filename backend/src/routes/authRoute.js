import express from "express";
import * as authController from "../controllers/authController.js";
import * as authMiddleware from '../middlewares/authMiddleware.js';
import { otpRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/register", otpRateLimiter, authMiddleware.validateSignUp, authController.signUp);
router.post("/send-signup-otp", otpRateLimiter, authMiddleware.validateEmail, authController.sendSignUpOTP);
router.post("/login", authMiddleware.validateLogIn, authController.logIn);
router.post("/logout", authController.logOut);
router.post("/refresh", authController.refreshToken);
router.post("/forgot-password", otpRateLimiter, authMiddleware.validateEmail, authController.forgotPassword);
router.post("/verify-otp", otpRateLimiter, authController.verifyForgotPasswordOTP);
router.post("/reset-password", authController.resetPassword);
router.put("/change-password", authMiddleware.protectedRoute, authController.changePassword);

export default router;

