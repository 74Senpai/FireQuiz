import AppError from '../errors/AppError.js';

export const isUsernameValid = (username) => {
  if (username.length < 3) {
    throw new AppError("Username phải lớn hơn 3 kí tự", 400);
  }

  if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
    throw new AppError("Username chỉ được chứa chữ, số, _ và .", 400);
  }
};

export const isPasswordValid = (password) => {
  if (password.length < 8) {
    throw new AppError("Mật khẩu phải lớn hơn 8 ký tự", 400);
  }
};

export const isEmailValid = (email) => {
  if (!email.includes('@')) {
    throw new AppError("Email không hợp lệ", 404);
  }
};
