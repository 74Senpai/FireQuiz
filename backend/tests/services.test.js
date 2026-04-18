import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import crypto from 'crypto';
import AppError from '../src/errors/AppError.js';

jest.unstable_mockModule('../src/repositories/userRepository.js', () => ({
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findByUsername: jest.fn(),
}));

jest.unstable_mockModule('../src/utils/otpManager.js', () => ({
  generateOTP: jest.fn(),
  verifyOTP: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/sessionRepository.js', () => ({
  create: jest.fn(),
  deleteSessionByToken: jest.fn(),
  findSessionByToken: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/quizRepository.js', () => ({
  getQuizById: jest.fn(),
  setStatus: jest.fn(),
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
let bcrypt;
let jwt;
let quizRepository;
let quizService;
let sessionRepository;
let userRepository;
let userService;

beforeEach(async () => {
  jest.resetModules();
  jest.clearAllMocks();

  userRepository = await import('../src/repositories/userRepository.js');
  sessionRepository = await import('../src/repositories/sessionRepository.js');
  quizRepository = await import('../src/repositories/quizRepository.js');

  bcrypt = (await import('bcrypt')).default;
  jwt = (await import('jsonwebtoken')).default;

  authService = await import('../src/services/authService.js');
  userService = await import('../src/services/userService.js');
  quizService = await import('../src/services/quizService.js');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Service Layer Unit Tests', () => {
  describe('authService.signUp', () => {
    it('should create user with valid data', async () => {
      const data = {
        password: 'pass',
        fullName: 'Test User',
        email: 'test@email.com',
        otp: '123456',
      };

      const otpManager = await import('../src/utils/otpManager.js');
      // @ts-ignore
      otpManager.verifyOTP.mockReturnValue(true);
      userRepository.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedpass');
      userRepository.create.mockResolvedValue();

      await authService.signUp(data);

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@email.com');
      // @ts-ignore
      expect(otpManager.verifyOTP).toHaveBeenCalledWith('test@email.com', '123456');
      expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        hashedPassword: 'hashedpass',
        fullName: 'Test User',
        email: 'test@email.com',
      });
    });

    it('should throw for duplicate email', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 1 });

      await expect(
        authService.signUp({
          password: 'pass',
          fullName: 'Test User',
          email: 'dup@email.com',
        }),
      ).rejects.toThrow();
    });
  });

  describe('authService.logIn', () => {
    it('should login with valid credentials', async () => {
      const user = {
        id: 1,
        role: 'user',
        password_hash: 'hash',
      };

      userRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token');
      jest.spyOn(crypto, 'randomBytes').mockReturnValue({
        toString: jest.fn().mockReturnValue('rtok'),
      });
      sessionRepository.create.mockResolvedValue();

      const result = await authService.logIn({
        email: 'user@email.com',
        password: 'pass',
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith('user@email.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('pass', 'hash');
      expect(sessionRepository.create).toHaveBeenCalledWith({
        userId: 1,
        token: 'rtok',
      });
      expect(result.accessToken).toBe('token');
      expect(result.refreshToken).toBe('rtok');
    });

    it('should throw for invalid email', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.logIn({
          email: 'bad@email.com',
          password: 'pass',
        }),
      ).rejects.toThrow();
    });

    it('should throw for invalid password', async () => {
      userRepository.findByEmail.mockResolvedValue({
        id: 1,
        role: 'user',
        password_hash: 'hash',
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.logIn({
          email: 'user@email.com',
          password: 'wrong',
        }),
      ).rejects.toThrow();
    });
  });

  describe('userService.getUserById', () => {
    it('should return mapped user data', async () => {
      userRepository.findById.mockResolvedValue({
        id: 1,
        role: 'user',
        full_name: 'Full Name',
        email: 'user@email.com',
      });

      const result = await userService.getUserById(1);

      expect(result).toEqual({
        id: 1,
        role: 'user',
        fullName: 'Full Name',
        email: 'user@email.com',
      });
    });

    it('should return null for non-existing user', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById(999)).resolves.toBeNull();
    });
  });

  describe('quizService.getQuiz', () => {
    it('should return public quiz', async () => {
      const mockQuiz = {
        id: 1,
        status: 'PUBLIC',
      };

      quizRepository.getQuizById.mockResolvedValue(mockQuiz);

      await expect(quizService.getQuiz(1, null)).resolves.toBe(mockQuiz);
    });

    it('should return private quiz for owner', async () => {
      const mockQuiz = {
        id: 1,
        status: 'PRIVATE',
        creator_id: 1,
      };

      quizRepository.getQuizById.mockResolvedValue(mockQuiz);

      await expect(quizService.getQuiz(1, { id: 1 })).resolves.toBe(mockQuiz);
    });

    it('should throw for unauthorized private quiz', async () => {
      quizRepository.getQuizById.mockResolvedValue({
        id: 1,
        status: 'PRIVATE',
        creator_id: 2,
      });

      await expect(quizService.getQuiz(1, { id: 1 })).rejects.toThrow();
    });
  });

  describe('quizService.setStatus', () => {
    it('should set status for owner', async () => {
      quizRepository.getQuizById.mockResolvedValue({
        id: 1,
        creator_id: 1,
      });
      quizRepository.setStatus.mockResolvedValue();

      await quizService.setStatus(1, { id: 1 }, 'PUBLIC');

      expect(quizRepository.setStatus).toHaveBeenCalledWith(1, 'PUBLIC');
    });

    it('should throw for non-owner', async () => {
      quizRepository.getQuizById.mockResolvedValue({
        id: 1,
        creator_id: 2,
      });

      await expect(
        quizService.setStatus(1, { id: 1 }, 'PUBLIC'),
      ).rejects.toThrow();
    });
  });
});
