import { jest } from '@jest/globals';

// 1. Mock DB trước khi import các module khác
jest.unstable_mockModule('../src/db/db.js', () => {
  const mockConn = {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    execute: jest.fn(),
  };
  return {
    default: {
      getConnection: jest.fn().mockResolvedValue(mockConn),
      execute: jest.fn()
    }
  };
});

// 2. Mock các Repository
jest.unstable_mockModule('../src/repositories/quizRepository.js', () => ({
  getQuizById: jest.fn(),
  getQuizByCode: jest.fn(),
  setStatus: jest.fn(),
  updatePromoteToPublicBySchedule: jest.fn(),
  updateDemotePublicPastAvailableUntil: jest.fn(),
  countPublicOpenQuizzes: jest.fn(),
  findPublicOpenQuizzes: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/attemptRepository.js', () => ({
  getActiveAttempt: jest.fn(),
  getAttemptSnapshot: jest.fn(),
  countTotalAttempts: jest.fn(),
  createQuizAttempt: jest.fn(),
  bulkInsertAttemptQuestions: jest.fn(),
  bulkInsertAttemptOptions: jest.fn(),
  getQuestionsAndAnswersByQuizId: jest.fn(),
}));

// Nạp dynamic import sau khi đã mock module xong cho môi trường esm "--experimental-vm-modules"
let quizService;
let attemptService;
let quizRepository;
let attemptRepository;
let db;

beforeAll(async () => {
  quizService = await import('../src/services/quizService.js');
  attemptService = await import('../src/services/attemptService.js');
  quizRepository = await import('../src/repositories/quizRepository.js');
  attemptRepository = await import('../src/repositories/attemptRepository.js');
  db = await import('../src/db/db.js');
});

describe('US APIs Integration / Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('US 1: Giao diện làm bài (Core UI) - startAttempt', () => {
    it('Nên khôi phục session (Active Attempt) và trả về câu hỏi nếu đã bắt đầu làm bài', async () => {
      const mockQuiz = {
        id: 1,
        title: 'Mock Quiz',
        time_limit_seconds: 1200,
        status: 'PUBLIC',
      };
      const mockActiveAttempt = {
        id: 99,
        quiz_title: 'Mock Quiz',
        started_at: new Date().toISOString(),
      };
      const mockAttemptSnapshot = {
        attemptId: 99,
        questions: [{ id: 1, text: 'Câu hỏi 1?', type: 'SINGLE_CHOICE', options: [] }]
      };

      quizRepository.getQuizById.mockResolvedValue(mockQuiz);
      attemptRepository.getActiveAttempt.mockResolvedValue(mockActiveAttempt);
      attemptRepository.getAttemptSnapshot.mockResolvedValue(mockAttemptSnapshot);

      const result = await attemptService.startAttempt(1, 100);

      expect(quizRepository.getQuizById).toHaveBeenCalledWith(1);
      expect(attemptRepository.getActiveAttempt).toHaveBeenCalledWith(1, 100);
      expect(result).toHaveProperty('quizTitle', 'Mock Quiz');
      expect(result).toHaveProperty('timeLimitSeconds');
      expect(result.questions).toHaveLength(1);
    });

    it('Nên throw Error (403) nếu bài Quiz không phải trạng thái PUBLIC', async () => {
      const mockQuiz = { id: 1, status: 'PRIVATE' };
      quizRepository.getQuizById.mockResolvedValue(mockQuiz);

      await expect(attemptService.startAttempt(1, 100))
        .rejects.toThrow("Quiz không công khai");
    });
  });

  describe('US 2: Luồng Tham gia Công khai - listPublicOpenQuizzes', () => {
    it('Nên trả về danh sách Quiz với Pagination và chạy trong Database Transaction an toàn', async () => {
      quizRepository.countPublicOpenQuizzes.mockResolvedValue(1);
      quizRepository.findPublicOpenQuizzes.mockResolvedValue([{ id: 1, title: 'Open Quiz' }]);

      const result = await quizService.listPublicOpenQuizzes({ page: 1, pageSize: 10 });
      
      const mockConn = await db.default.getConnection();
      expect(mockConn.beginTransaction).toHaveBeenCalled();
      expect(quizRepository.updatePromoteToPublicBySchedule).toHaveBeenCalledWith(mockConn);
      expect(quizRepository.updateDemotePublicPastAvailableUntil).toHaveBeenCalledWith(mockConn);
      expect(mockConn.commit).toHaveBeenCalled();
      expect(mockConn.release).toHaveBeenCalled();

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual(expect.objectContaining({
        page: 1,
        pageSize: 10,
        totalItems: 1
      }));
    });
  });

  describe('US 3: Luồng Tham gia bằng mã PIN - joinQuizByCode', () => {
    it('Nên tìm Quiz theo PIN và gọi nội bộ startAttempt nếu PIN hợp lệ', async () => {
      const mockQuiz = {
        id: 5,
        quiz_code: 'ABCDEF',
        status: 'PUBLIC',
      };
      
      const mockAttemptSnapshot = {
        attemptId: 100,
        questions: []
      };

      quizRepository.getQuizByCode.mockResolvedValue(mockQuiz);
      // Giả lập nội bộ startAttempt bằng cách giả lập các hàm repo bên trong startAttempt luôn
      quizRepository.getQuizById.mockResolvedValue(mockQuiz);
      attemptRepository.getActiveAttempt.mockResolvedValue({ id: 100, started_at: new Date() });
      attemptRepository.getAttemptSnapshot.mockResolvedValue(mockAttemptSnapshot);

      const result = await attemptService.joinQuizByCode('ABCDEF', 200);

      expect(quizRepository.getQuizByCode).toHaveBeenCalledWith('ABCDEF');
      // Trả lại cấu trúc của quiz cho user
      expect(result.id).toBe(5);
    });

    it('Nên throw Error (404) nếu PIN không hợp lệ', async () => {
      quizRepository.getQuizByCode.mockResolvedValue(null);

      await expect(attemptService.joinQuizByCode('INVALID', 200))
        .rejects.toThrow("Sai PIN");
    });
  });
});
