import * as authService from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../errors/AppError.js';

export const signUp = asyncHandler(async (req, res) => {
  const { password, fullName, email, otp } = req.body;

  await authService.signUp({ password, fullName, email, otp });

  return res.status(201).json({ message: "Đăng ký tài khoản thành công" });
});

export const sendSignUpOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email là bắt buộc", 400);
  }

  const response = await authService.sendSignUpOTP(email);

  return res.status(200).json(response);
});

export const logIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const response = await authService.logIn({ email, password });

  res.cookie('refreshToken', response.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: response.REFRESH_TOKEN_TTL
  });

  return res.status(200).json({ message: `User ${email} đã đăng nhập`, accessToken: response.accessToken });
});

export const logOut = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await authService.logOut(token);

    res.clearCookie("refreshToken");
  }
  return res.status(204).send();
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new AppError("Token không tồn tại", 401);
  }

  const response = await authService.refreshToken(token);

  res.cookie('refreshToken', response.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: response.REFRESH_TOKEN_TTL
  });

  return res.status(200).json({ message: `Cấp lại access token thành công`, accessToken: response.accessToken });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email là bắt buộc", 400);
  }

  const response = await authService.forgotPassword(email);

  return res.status(200).json(response);
});


export const verifyForgotPasswordOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError("Email và OTP là bắt buộc", 400);
  }

  const response = await authService.verifyForgotPasswordOTP(email, otp);

  return res.status(200).json(response);
});


export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    throw new AppError("Thiếu resetToken hoặc mật khẩu mới", 400);
  }

  const response = await authService.resetPassword(resetToken, newPassword);

  return res.status(200).json(response);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new AppError("Thiếu mật khẩu cũ hoặc mật khẩu mới", 400);
  }

  const response = await authService.changePassword(req.user.id, oldPassword, newPassword);

  return res.status(200).json(response);
});
