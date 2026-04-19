import { asyncHandler } from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import * as validator from '../validators/validator.js';
import AppError from '../errors/AppError.js';
import jwt from 'jsonwebtoken';
import * as userService from '../services/userService.js';
import dotenv from 'dotenv';
dotenv.config();

export const validateEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError("Email là bắt buộc", 400);
  }
  validator.isEmailValid(email);
  next();
});

export const validateSignUp = asyncHandler(async (req, res, next) => {
  const { password, fullName, email, otp } = req.body;

  if (!password || !fullName || !email || !otp) {
    throw new AppError("Không được trống password, fullName, email, otp", 400);
  }

  validator.isPasswordValid(password);
  validator.isEmailValid(email);
  next();
});

export const validateLogIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Không được để trống email hoặc password", 404);
  }

  validator.isEmailValid(email);
  validator.isPasswordValid(password);
  next();
});

export const protectedRoute = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    throw new AppError("Không tìm thấy access token", 401);
  }

  let decodedUser;

  try {
    decodedUser = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    throw new AppError("Access token hết hạn hoặc không đúng", 403);
  }

  logger.debug(`authMiddleware.js - decodedUser.userId = ${decodedUser.userId}`);
  const user = await userService.getUserById(decodedUser.userId);

  if (!user) {
    throw new AppError("Người dùng không tồn tại", 404);
  }

  logger.debug(`authMiddleware.js - user.id = ${user.id}`);

  req.user = user;
  logger.debug(`authMiddleware.js - req.user = ${req.user.id}`);

  next();
});

export const getIdFromToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.split(" ")[1];

  // Nếu không có trong header, thử lấy từ query param (dùng cho <img>, <video> tag)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return next();
  }

  let decodedUser;

  try {
    decodedUser = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch {
    return next();
  }

  const user = await userService.getUserById(decodedUser.userId);

  if (!user) {
    return next();
  }

  req.user = user;

  next();
});
