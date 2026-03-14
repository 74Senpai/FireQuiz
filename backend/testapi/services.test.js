import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import * as authService from '../../src/services/authService.js';
import * as userRepository from '../../src/repositories/userRepository.js';
import * as sessionRepository from '../../src/repositories/sessionRepository.js';
import * as quizRepository from '../../src/repositories/quizRepository.js';
import * as userService from '../../src/services/userService.js';
import * as quizService from '../../src/services/quizService.js';
import AppError from '../../src/errors/AppError.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Mock all dependencies
vi.mock('../../src/repositories/userRepository.js');
vi.mock('../../src/repositories/sessionRepository.js');
vi.mock('../../src/repositories/quizRepository.js');
vi.mock('bcrypt');
vi.mock('jsonwebtoken');
vi.mock('crypto');

describe('Service Layer Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Test 1: authService.signUp
    describe('authService.signUp', () => {
        it('should create user with valid data', async () => {
            const data = { username: 'test', password: 'pass', fullName: 'Test', email: 'test@email.com' };
            const hashed = 'hashedpass';
            userRepository.findByUsername.mockResolvedValue(null);
            userRepository.findByEmail.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue(hashed);
            userRepository.create.mockResolvedValue();

            await authService.signUp(data);

            expect(userRepository.findByUsername).toHaveBeenCalledWith('test');
            expect(userRepository.findByEmail).toHaveBeenCalledWith('test@email.com');
            expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
            expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                username: 'test',
                hashedPassword: hashed
            }));
        });

        it('should throw for duplicate username', async () => {
            userRepository.findByUsername.mockResolvedValue({});

            await expect(authService.signUp({ username: 'dup', password: 'pass' })).rejects.toThrow(AppError);
        });

        it('should throw for duplicate email', async () => {
            userRepository.findByUsername.mockResolvedValue(null);
            userRepository.findByEmail.mockResolvedValue({});

            await expect(authService.signUp({ username: 'new', password: 'pass', email: 'dup' })).rejects.toThrow(AppError);
        });
    });

    // Test 2: authService.logIn
    describe('authService.logIn', () => {
        it('should login with valid creds', async () => {
            const data = { username: 'user', password: 'pass' };
            const user = { id: 1, role: 'user', password_hash: 'hash' };
            userRepository.findByUsername.mockResolvedValue(user);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token');
            crypto.randomBytes.mockReturnValue({ toString: vi.fn().mockReturnValue('rtok') });
            sessionRepository.create.mockResolvedValue();

            const result = await authService.logIn(data);

            expect(bcrypt.compare).toHaveBeenCalled();
            expect(sessionRepository.create).toHaveBeenCalled();
            expect(result.accessToken).toBe('token');
        });

        it('should throw for invalid username', async () => {
            userRepository.findByUsername.mockResolvedValue(null);

            await expect(authService.logIn({ username: 'bad', password: 'pass' })).rejects.toThrow(AppError);
        });

        it('should throw for invalid password', async () => {
            const user = { password_hash: 'hash' };
            userRepository.findByUsername.mockResolvedValue(user);
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.logIn({ username: 'user', password: 'wrong' })).rejects.toThrow(AppError);
        });
    });

    // Test 3: userService.getUserById
    describe('userService.getUserById', () => {
        it('should return user data', async () => {
            const mockUser = { id: 1, username: 'user', role: 'user', full_name: 'Full Name' };
            userRepository.findById.mockResolvedValue(mockUser);

            const result = await userService.getUserById(1);

            expect(result).toEqual({ id: 1, username: 'user', role: 'user', fullName: 'Full Name' });
        });

        it('should return null for non-existing user', async () => {
            userRepository.findById.mockResolvedValue(null);

            const result = await userService.getUserById(999);

            expect(result).toBeNull();
        });
    });

    // Test 4: quizService.getQuiz
    describe('quizService.getQuiz', () => {
        it('should return public quiz', async () => {
            const mockQuiz = { id: 1, status: 'PUBLIC' };
            quizRepository.getQuizById.mockResolvedValue(mockQuiz);

            const result = await quizService.getQuiz(1, null);

            expect(result).toBe(mockQuiz);
        });

        it('should return private quiz for owner', async () => {
            const mockQuiz = { id: 1, status: 'PRIVATE', creator_id: 1 };
            const user = { id: 1 };
            quizRepository.getQuizById.mockResolvedValue(mockQuiz);

            const result = await quizService.getQuiz(1, user);

            expect(result).toBe(mockQuiz);
        });

        it('should throw for unauthorized private quiz', async () => {
            const mockQuiz = { id: 1, status: 'PRIVATE', creator_id: 2 };
            const user = { id: 1 };
            quizRepository.getQuizById.mockResolvedValue(mockQuiz);

            await expect(quizService.getQuiz(1, user)).rejects.toThrow(AppError);
        });
    });

    // Test 5: quizService.setStatus
    describe('quizService.setStatus', () => {
        it('should set status for owner', async () => {
            const mockQuiz = { id: 1, user_id: 1 };
            const user = { id: 1 };
            quizRepository.getQuizById.mockResolvedValue(mockQuiz);
            quizRepository.setStatus.mockResolvedValue();

            await quizService.setStatus(1, user, 'PUBLIC');

            expect(quizRepository.setStatus).toHaveBeenCalledWith(1, 'PUBLIC');
        });

        it('should throw for non-owner', async () => {
            const mockQuiz = { id: 1, user_id: 2 };
            const user = { id: 1 };
            quizRepository.getQuizById.mockResolvedValue(mockQuiz);

            await expect(quizService.setStatus(1, user, 'PUBLIC')).rejects.toThrow(AppError);
        });
    });
});

