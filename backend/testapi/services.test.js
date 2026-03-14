import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import AppError from '../src/errors/AppError.js';
import crypto from 'crypto';


/*
==================================================
FILE TEST SERVICE LAYER
==================================================

File này dùng để test các hàm trong tầng Service (business logic)

Mục tiêu:
- Không truy cập database thật
- Không gọi thư viện thật như bcrypt hoặc jwt

Thay vào đó:
- Mock repository (database layer)
- Mock thư viện ngoài

Nhờ vậy ta chỉ test logic của service.
*/


/*
MOCK CÁC REPOSITORY (TẦNG DATABASE)
*/

jest.unstable_mockModule('../src/repositories/userRepository.js', () => ({
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/sessionRepository.js', () => ({
    create: jest.fn(),
    findSessionByToken: jest.fn(),
    deleteSessionByToken: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/quizRepository.js', () => ({
    getQuizById: jest.fn(),
    setStatus: jest.fn(),
}));


/*
MOCK THƯ VIỆN NGOÀI
*/

jest.unstable_mockModule('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
    sign: jest.fn(),
}));


/*
KHAI BÁO BIẾN SẼ DÙNG TRONG TEST
*/

let authService;
let userRepository;
let sessionRepository;
let quizRepository;
let userService;
let quizService;
let bcrypt;
let jwt;


/*
CHẠY TRƯỚC MỖI TEST
*/

beforeEach(async () => {

    // Xóa toàn bộ mock cũ để tránh ảnh hưởng test khác
    jest.clearAllMocks();

    // Import repository đã được mock
    userRepository = await import('../src/repositories/userRepository.js');
    sessionRepository = await import('../src/repositories/sessionRepository.js');
    quizRepository = await import('../src/repositories/quizRepository.js');

    // Import thư viện đã mock
    bcrypt = await import('bcrypt');
    jwt = await import('jsonwebtoken');

    // Import service cần test
    authService = await import('../src/services/authService.js');
    userService = await import('../src/services/userService.js');
    quizService = await import('../src/services/quizService.js');
});


describe('Service Layer Unit Tests', () => {

    /*
    1 TEST AUTH SERVICE
    */

    describe('authService.signUp', () => {

        // Test tạo user mới thành công
        it('should create user with valid data', async () => {

            const data = {
                username: 'test',
                password: 'pass',
                fullName: 'Test',
                email: 'test@email.com'
            };

            const hashed = 'hashedpass';

            // Giả lập database không có username/email trùng
            userRepository.findByUsername.mockResolvedValue(null);
            userRepository.findByEmail.mockResolvedValue(null);

            // Giả lập bcrypt hash password
            bcrypt.hash.mockResolvedValue(hashed);

            userRepository.create.mockResolvedValue();

            await authService.signUp(data);

            // Kiểm tra các hàm đã được gọi đúng chưa
            expect(userRepository.findByUsername).toHaveBeenCalledWith('test');

            expect(userRepository.findByEmail)
                .toHaveBeenCalledWith('test@email.com');

            expect(bcrypt.hash)
                .toHaveBeenCalledWith('pass', 10);

            expect(userRepository.create)
                .toHaveBeenCalledWith(expect.objectContaining({
                    username: 'test',
                    hashedPassword: hashed
                }));
        });


        // Test lỗi khi username đã tồn tại
        it('should throw for duplicate username', async () => {

            userRepository.findByUsername.mockResolvedValue({});

            await expect(
                authService.signUp({ username: 'dup', password: 'pass' })
            ).rejects.toThrow(AppError);

        });


        // Test lỗi khi email đã tồn tại
        it('should throw for duplicate email', async () => {

            userRepository.findByUsername.mockResolvedValue(null);
            userRepository.findByEmail.mockResolvedValue({});

            await expect(
                authService.signUp({
                    username: 'new',
                    password: 'pass',
                    email: 'dup'
                })
            ).rejects.toThrow(AppError);

        });

    });



    /*
    2 TEST LOGIN
    */

    describe('authService.logIn', () => {

        // Test login thành công
        it('should login with valid creds', async () => {

            const data = {
                username: 'user',
                password: 'pass'
            };

            const user = {
                id: 1,
                role: 'user',
                password_hash: 'hash'
            };

            userRepository.findByUsername.mockResolvedValue(user);

            bcrypt.compare.mockResolvedValue(true);

            jwt.sign.mockReturnValue('token');

            // mock tạo refresh token
            jest.spyOn(crypto, 'randomBytes')
                .mockReturnValue({
                    toString: jest.fn().mockReturnValue('rtok')
                });

            sessionRepository.create.mockResolvedValue();

            const result = await authService.logIn(data);

            expect(bcrypt.compare).toHaveBeenCalled();

            expect(sessionRepository.create).toHaveBeenCalled();

            expect(result.accessToken).toBe('token');

        });


        // Test username không tồn tại
        it('should throw for invalid username', async () => {

            userRepository.findByUsername.mockResolvedValue(null);

            await expect(
                authService.logIn({
                    username: 'bad',
                    password: 'pass'
                })
            ).rejects.toThrow(AppError);

        });


        // Test password sai
        it('should throw for invalid password', async () => {

            const user = { password_hash: 'hash' };

            userRepository.findByUsername.mockResolvedValue(user);

            bcrypt.compare.mockResolvedValue(false);

            await expect(
                authService.logIn({
                    username: 'user',
                    password: 'wrong'
                })
            ).rejects.toThrow(AppError);

        });

    });



    /*
    3 TEST USER SERVICE
    */

    describe('userService.getUserById', () => {

        // Test lấy user thành công
        it('should return user data', async () => {

            const mockUser = {
                id: 1,
                username: 'user',
                role: 'user',
                full_name: 'Full Name'
            };

            userRepository.findById.mockResolvedValue(mockUser);

            const result = await userService.getUserById(1);

            expect(result).toEqual({
                id: 1,
                username: 'user',
                role: 'user',
                fullName: 'Full Name'
            });

        });


        // Test user không tồn tại
        it('should return null for non-existing user', async () => {

            userRepository.findById.mockResolvedValue(null);

            const result = await userService.getUserById(999);

            expect(result).toBeNull();

        });

    });

    /*
    4 TEST QUIZ SERVICE
    */

    describe('quizService.getQuiz', () => {

        // Quiz public ai cũng xem được
        it('should return public quiz', async () => {

            const mockQuiz = {
                id: 1,
                status: 'PUBLIC'
            };

            quizRepository.getQuizById.mockResolvedValue(mockQuiz);

            const result = await quizService.getQuiz(1, null);

            expect(result).toBe(mockQuiz);

        });


        // Quiz private nhưng đúng chủ sở hữu
        it('should return private quiz for owner', async () => {

            const mockQuiz = {
                id: 1,
                status: 'PRIVATE',
                creator_id: 1
            };

            const user = { id: 1 };

            quizRepository.getQuizById.mockResolvedValue(mockQuiz);

            const result = await quizService.getQuiz(1, user);

            expect(result).toBe(mockQuiz);

        });


        // Quiz private nhưng không phải chủ
        it('should throw for unauthorized private quiz', async () => {

            const mockQuiz = {
                id: 1,
                status: 'PRIVATE',
                creator_id: 2
            };

            const user = { id: 1 };

            quizRepository.getQuizById.mockResolvedValue(mockQuiz);

            await expect(
                quizService.getQuiz(1, user)
            ).rejects.toThrow(AppError);

        });

    });



    /*
    5 TEST SET STATUS QUIZ
    */

    describe('quizService.setStatus', () => {

        // Chủ quiz có quyền đổi trạng thái
        it('should set status for owner', async () => {

            const mockQuiz = {
                id: 1,
                user_id: 1
            };

            const user = { id: 1 };

            quizRepository.getQuizById.mockResolvedValue(mockQuiz);

            quizRepository.setStatus.mockResolvedValue();

            await quizService.setStatus(1, user, 'PUBLIC');

            expect(quizRepository.setStatus)
                .toHaveBeenCalledWith(1, 'PUBLIC');

        });


        // Không phải chủ quiz -> lỗi
        it('should throw for non-owner', async () => {

            const mockQuiz = {
                id: 1,
                user_id: 2
            };

            const user = { id: 1 };

            quizRepository.getQuizById.mockResolvedValue(mockQuiz);

            await expect(
                quizService.setStatus(1, user, 'PUBLIC')
            ).rejects.toThrow(AppError);

        });

    });

});