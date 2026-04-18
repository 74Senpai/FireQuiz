import { jest } from '@jest/globals';

// 1. Mock DB
jest.unstable_mockModule('../src/db/db.js', () => ({
  default: {
    getConnection: jest.fn().mockResolvedValue({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    }),
    execute: jest.fn().mockResolvedValue([[]]),
    query: jest.fn().mockResolvedValue([[]]),
  }
}));

jest.unstable_mockModule('../src/services/supabaseService.js', () => ({
  deleteFileFromSupabase: jest.fn(),
  supabaseAvatarBucket: 'avatars',
}));

// 2. Mock Cache
jest.unstable_mockModule('../src/cache/cacheClient.js', () => ({
  buildDraftKey: Number,
  getCache: jest.fn(),
  setCache: jest.fn(),
  delCache: jest.fn(),
}));

// 3. Mock Repositories
jest.unstable_mockModule('../src/repositories/userRepository.js', () => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  updateAvatar: jest.fn(),
  updateProfileData: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/quizRepository.js', () => ({
  getQuizById: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/attemptRepository.js', () => ({
  getQuizAttemptById: jest.fn(),
  getAllOptionsByAttemptId: jest.fn(),
  bulkDeleteAttemptAnswersByOptionIds: jest.fn(),
  bulkInsertAttemptAnswers: jest.fn(),
  getAttemptScoreData: jest.fn(),
  markAttemptFinished: jest.fn(),
}));

// Dynamic Imports
let userService;
let attemptService;
let draftController; // for draft integration
let cache;
let userRepo;
let attemptRepo;

beforeAll(async () => {
  userService = await import('../src/services/userService.js');
  attemptService = await import('../src/services/attemptService.js');
  draftController = await import('../src/controllers/draftController.js');
  cache = await import('../src/cache/cacheClient.js');
  userRepo = await import('../src/repositories/userRepository.js');
  attemptRepo = await import('../src/repositories/attemptRepository.js');
});

describe('User Actions Extended - Unit Tests', () => {
  const mockUser = { id: 1 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Profile & Avatar', () => {
    it('Nên cập nhật avatar thành công', async () => {
      userRepo.findById.mockResolvedValue({ id: 1, avatar_url: 'old.jpg' });
      userRepo.updateAvatar.mockResolvedValue(true);
      await userService.updateAvatar(1, 'http://new-avatar.jpg');
      expect(userRepo.updateAvatar).toHaveBeenCalledWith(1, 'http://new-avatar.jpg');
    });

    it('Nên cập nhật thông tin cá nhân thành công', async () => {
      userRepo.findByEmail.mockResolvedValue(null); // No conflict
      userRepo.updateProfileData.mockResolvedValue(true);
      await userService.updateProfileData(1, { fullName: 'New Name', email: 'new@test.com', bio: 'New Bio' });
      expect(userRepo.updateProfileData).toHaveBeenCalledWith(1, { fullName: 'New Name', email: 'new@test.com', bio: 'New Bio' });
    });
  });

  describe('Draft System Integration', () => {
    it('saveDraft nên gọi setCache với đúng dữ liệu', async () => {
      const req = {
        user: { id: 1 },
        body: { quizId: 10, answers: { 101: [201] }, textAnswers: {}, timestamp: 12345 }
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      await draftController.saveDraft(req, res);

      expect(cache.setCache).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        quizId: 10,
        userId: 1,
        answers: { 101: [201] }
      }));
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('getDraft nên trả về 404 nếu không có trong cache', async () => {
      const req = { user: { id: 1 }, query: { quizId: 10 } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      cache.getCache.mockReturnValue(null);

      await draftController.getDraft(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Quiz Submission (finishAttempt)', () => {
    it('Nên nộp bài và tính điểm đúng', async () => {
      const attemptId = 99;
      const userId = 1;
      const mockAttempt = { id: 99, user_id: 1, quiz_id: 10, finished_at: null };
      const mockQuiz = { id: 10, grading_scale: 10 };
      const mockOptions = [{ id: 201, attempt_question_id: 101 }];

      attemptRepo.getQuizAttemptById.mockResolvedValue(mockAttempt);
      const quizRepo = await import('../src/repositories/quizRepository.js');
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);
      attemptRepo.getAllOptionsByAttemptId.mockResolvedValue(mockOptions);
      attemptRepo.getAttemptScoreData.mockResolvedValue({ total: 10, correct: 8 });

      const result = await attemptService.finishAttempt(attemptId, userId, { 101: [201] });

      expect(attemptRepo.markAttemptFinished).toHaveBeenCalledWith(attemptId, 8.0);
      expect(result.score).toBe(8.0);
      expect(result.message).toBe('Nộp bài thành công');
      expect(cache.delCache).toHaveBeenCalled();
    });

    it('Nên chặn nộp bài nếu bài đã nộp rồi', async () => {
      attemptRepo.getQuizAttemptById.mockResolvedValue({ id: 99, user_id: 1, finished_at: 'already-done' });
      const result = await attemptService.finishAttempt(99, 1);
      expect(result.message).toBe('Bài đã được nộp trước đó');
      expect(attemptRepo.markAttemptFinished).not.toHaveBeenCalled();
    });
  });
});
