import * as userRepository from "../repositories/userRepository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import AppError from "../errors/AppError.js";
import * as sessionRepository from "../repositories/sessionRepository.js";
import { generateOTP, verifyOTP } from "../untils/otpManager.js";
import { sendOTPEmail } from "../untils/mailService.js";
import dotenv from "dotenv";
dotenv.config();

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "7d";
// 14d
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

const parseDurationToMs = (duration) => {
  if (typeof duration !== "string" || !duration.trim()) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const normalized = duration.trim().toLowerCase();
  const match = normalized.match(/^(\d+)(ms|s|m|h|d)$/);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];

  const unitMap = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * unitMap[unit];
};

const ACCESS_TOKEN_MAX_AGE = parseDurationToMs(ACCESS_TOKEN_TTL);

export const signUp = async (data) => {
  const { password, fullName, email } = data;

  const emailDuplicate = await userRepository.findByEmail(data.email);

  if (emailDuplicate) {
    throw new AppError("Email đã tồn tại", 409);
  }

  // salt = 10
  const hashedPassword = await bcrypt.hash(password, 10);

  await userRepository.create({
    hashedPassword,
    fullName,
    email,
  });
};

export const logIn = async (data) => {
  const { email, password } = data;

  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new AppError("Email hoặc password không chính xác", 401);
  }

  const passwordCorrect = await bcrypt.compare(password, user.password_hash);

  if (!passwordCorrect) {
    throw new AppError("Email hoặc password không chính xác", 401);
  }

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: ACCESS_TOKEN_TTL },
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");

  await sessionRepository.create({
    userId: user.id,
    token: refreshToken,
  });

  return {
    accessToken,
    ACCESS_TOKEN_MAX_AGE,
    REFRESH_TOKEN_TTL,
    refreshToken,
  };
};

export const logOut = async (token) => {
  await sessionRepository.deleteSessionByToken(token);
};

export const refreshToken = async (token) => {
  const rfToken = await sessionRepository.findSessionByToken(token);

  if (!rfToken) {
    throw new AppError("Token không hợp lệ hoặc đã hết hạn", 403);
  }

  if (new Date(rfToken.expires_at) < new Date()) {
    throw new AppError("Token đã hết hạn", 403);
  }

  const user = await userRepository.findById(rfToken.user_id);

  if (!user) {
    throw new AppError("Token không hợp lệ", 403);
  }

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: ACCESS_TOKEN_TTL },
  );

  const newRefreshToken = crypto.randomBytes(64).toString("hex");

  await sessionRepository.create({
    userId: user.id,
    token: newRefreshToken,
  });

  await sessionRepository.deleteSessionByToken(token);

  return {
    accessToken,
    ACCESS_TOKEN_MAX_AGE,
    refreshToken: newRefreshToken,
    REFRESH_TOKEN_TTL,
  };
};

export const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new AppError("Email không tồn tại", 404);
  }

  const otp = generateOTP(email);

  await sendOTPEmail(email, otp);

  return { message: "OTP đã được gửi tới email" };
};

export const verifyForgotPasswordOTP = async (email, otp) => {
  const valid = verifyOTP(email, otp);

  if (!valid) {
    throw new AppError("OTP không hợp lệ hoặc đã hết hạn", 400);
  }

  const resetToken = jwt.sign({ email }, process.env.JWT_SECRET_KEY, {
    expiresIn: "5m",
  });

  return {
    message: "OTP hợp lệ",
    resetToken,
  };
};

export const resetPassword = async (resetToken, newPassword) => {

  let payload;

  try {
    payload = jwt.verify(resetToken, process.env.JWT_SECRET_KEY);
  } catch {
    throw new AppError("Reset token không hợp lệ hoặc đã hết hạn", 403);
  }

  const email = payload.email;

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await userRepository.updatePasswordByEmail(email, hashedPassword);

  return { message: "Đổi mật khẩu thành công" };
};

export { ACCESS_TOKEN_MAX_AGE, ACCESS_TOKEN_TTL };
