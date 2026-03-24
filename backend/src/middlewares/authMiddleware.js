import { asyncHandler } from '../untils/asyncHandler.js';
import * as validator from '../validators/validator.js';
import AppError from '../errors/AppError.js';
import jwt from 'jsonwebtoken';
import * as userService from '../services/userService.js';
import dotenv from 'dotenv';
dotenv.config();

export const validateSignUp = asyncHandler(async (req, res, next) => {
  const { username, password, fullName, email } = req.body;

  if (!password || !fullName || !email) {
    throw new AppError("Không được trống password, fullname, email", 404);
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
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new AppError("Không tìm thấy access token", 401);
  }

  let decodedUser;

  try {
    decodedUser = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    throw new AppError("Access token hết hạn hoặc không đúng", 403);
  }

  console.log("info: in authMiddleware:49 decodedUser.userId = " + decodedUser.userId);
  const user = await userService.getUserById(decodedUser.userId);

  if (!user) {
    throw new AppError("Người dùng không tồn tại", 404);
  }

  console.log(`info: in authMiddleware:56 user.id = ${user.id}`);

  req.user = user;
  console.log(`info: in authMiddleware:57 req.user = ${req.user.id}`);

  next();
});

export const getIdFromToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

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
