import * as authService from '../services/authService.js';
import { asyncHandler } from '../untils/asyncHandler.js';
import AppError from '../errors/AppError.js';

export const signUp = asyncHandler(async (req, res) => {
  const { username, password, fullName, email } = req.body;

  await authService.signUp({ username, password, fullName, email });

  return res.status(204).send();
});

export const logIn = asyncHandler(async(req, res) => {
  const { username, password } = req.body;

  const response = await authService.logIn({ username, password });
  
  res.cookie('refreshToken', response.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: response.REFRESH_TOKEN_TTL
  });

  return res.status(200).json({message:`User ${username} đã đăng nhập`, accessToken:response.accessToken});
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

  return res.status(200).json({message:`Cấp lại access token thành công`, accessToken:response.accessToken});
}); 
