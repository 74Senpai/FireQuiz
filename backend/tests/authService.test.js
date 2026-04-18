import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AppError from '../src/errors/AppError.js';

// Mocking dependencies
jest.unstable_mockModule('../src/repositories/userRepository.js', () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
  updatePasswordByEmail: jest.fn(),
}));

jest.unstable_mockModule('../src/utils/otpManager.js', () => ({
  generateOTP: jest.fn(),
  verifyOTP: jest.fn(),
}));

jest.unstable_mockModule('../src/utils/mailService.js', () => ({
  sendOTPEmail: jest.fn(),
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
}));

let authService;
let userRepository;
let otpManager;
let mailService;
let bcrypt;
let jwt;

beforeEach(async () => {
  jest.clearAllMocks();
  userRepository = await import('../src/repositories/userRepository.js');
  otpManager = await import('../src/utils/otpManager.js');
  mailService = await import('../src/utils/mailService.js');
  bcrypt = (await import('bcrypt')).default;
  jwt = (await import('jsonwebtoken')).default;
  authService = await import('../src/services/authService.js');
});

describe('authService - Nâng cấp luồng đăng ký & OTP', () => {

  describe('sendSignUpOTP', () => {
    it('Nên ném lỗi 409 nếu email đã tồn tại', async () => {
      // @ts-ignore
      userRepository.findByEmail.mockResolvedValue({ id: 1 });
      await expect(authService.sendSignUpOTP('test@gmail.com')).rejects.toThrow(AppError);
      await expect(authService.sendSignUpOTP('test@gmail.com')).rejects.toThrow('Email này đã được đăng ký');
    });

    it('Nên gọi generateOTP và gửi mail nếu email hợp lệ', async () => {
      // @ts-ignore
      userRepository.findByEmail.mockResolvedValue(null);
      // @ts-ignore
      otpManager.generateOTP.mockReturnValue('123456');
      // @ts-ignore
      mailService.sendOTPEmail.mockResolvedValue();

      const res = await authService.sendSignUpOTP('new@gmail.com');
      
      expect(otpManager.generateOTP).toHaveBeenCalledWith('new@gmail.com');
      expect(mailService.sendOTPEmail).toHaveBeenCalledWith('new@gmail.com', '123456');
      expect(res.message).toBeDefined();
    });
  });

  describe('signUp', () => {
    const validData = {
      fullName: 'Test User',
      email: 'test@gmail.com',
      password: 'password123',
      otp: '123456'
    };

    it('Nên ném lỗi 400 nếu OTP không đúng/hết hạn', async () => {
      // @ts-ignore
      userRepository.findByEmail.mockResolvedValue(null);
      // @ts-ignore
      otpManager.verifyOTP.mockReturnValue(false);

      await expect(authService.signUp(validData)).rejects.toThrow('Mã OTP không đúng hoặc đã hết hạn');
    });

    it('Nên đăng ký thành công nếu dữ liệu và OTP hợp lệ', async () => {
      // @ts-ignore
      userRepository.findByEmail.mockResolvedValue(null);
      // @ts-ignore
      otpManager.verifyOTP.mockReturnValue(true);
      // @ts-ignore
      bcrypt.hash.mockResolvedValue('hashed_password');
      // @ts-ignore
      userRepository.create.mockResolvedValue();

      await authService.signUp(validData);

      expect(userRepository.create).toHaveBeenCalledWith({
        fullName: validData.fullName,
        email: validData.email,
        hashedPassword: 'hashed_password'
      });
    });
  });

  describe('forgotPassword', () => {
    it('Nên ném lỗi 404 nếu email không tồn tại', async () => {
      // @ts-ignore
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(authService.forgotPassword('none@gmail.com')).rejects.toThrow('Email không tồn tại');
    });

    it('Nên gửi OTP nếu email tồn tại', async () => {
      // @ts-ignore
      userRepository.findByEmail.mockResolvedValue({ id: 1 });
      // @ts-ignore
      otpManager.generateOTP.mockReturnValue('111222');
      // @ts-ignore
      mailService.sendOTPEmail.mockResolvedValue();

      await authService.forgotPassword('exist@gmail.com');
      expect(mailService.sendOTPEmail).toHaveBeenCalledWith('exist@gmail.com', '111222');
    });
  });
});
