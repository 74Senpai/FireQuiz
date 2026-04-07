import { jest } from '@jest/globals';

jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn().mockReturnValue(true),
  },
  existsSync: jest.fn().mockReturnValue(true),
}));

// 1. Mock DB
jest.unstable_mockModule('../src/db/db.js', () => ({
  default: {
    getConnection: jest.fn(),
    execute: jest.fn(),
  }
}));

// 2. Mock các Repository
jest.unstable_mockModule('../src/repositories/quizRepository.js', () => ({
  createQuiz: jest.fn(),
  getQuizById: jest.fn(),
  getQuizByCode: jest.fn(),
  updateQuizInfo: jest.fn(),
  updateQuizSettings: jest.fn(),
  setStatus: jest.fn(),
  getListQuizByUserId: jest.fn(),
  findByQuizCode: jest.fn(),
  setQuizCode: jest.fn(),
  hardDelete: jest.fn(),
  softDelete: jest.fn(),
  getPublicQuizzes: jest.fn(),
  updatePromoteToPublicBySchedule: jest.fn(),
  updateDemotePublicPastAvailableUntil: jest.fn(),
  countPublicOpenQuizzes: jest.fn(),
  findPublicOpenQuizzes: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/questionRepository.js', () => ({
  getListQuestionByQuizId: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/answerRepository.js', () => ({
  getAnswersByQuestionIds: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/userRepository.js', () => ({
  findById: jest.fn(),
  findActiveUsersByIds: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/attemptRepository.js', () => ({
  getFinishedAttemptsByQuizId: jest.fn(),
  getLatestAttemptsByQuizId: jest.fn(),
  getUserAttemptCountsByQuizId: jest.fn(),
  getAttemptQuestionsByAttemptIds: jest.fn(),
  getAttemptOptionsByQuestionIds: jest.fn(),
  getAttemptAnswersByOptionIds: jest.fn(),
}));

// 3. Mock logic PDF/Excel cho service report nếu cần (ở đây test service cụ thể nên có thể mock thư viện ngoài)
jest.unstable_mockModule('exceljs', () => {
  return {
    default: {
      Workbook: jest.fn().mockImplementation(() => ({
        addWorksheet: jest.fn().mockReturnValue({
          columns: [],
          addRow: jest.fn(),
          mergeCells: jest.fn(),
          getCell: jest.fn().mockReturnValue({ font: {}, alignment: {} }),
          getRow: jest.fn().mockReturnValue({ values: [], font: {}, fill: {} }),
          eachRow: jest.fn(),
        }),
        xlsx: {
          writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-excel-buffer')),
        },
      })),
    }
  };
});

jest.unstable_mockModule('pdfkit', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      on: jest.fn().mockImplementation(function(event, cb) {
        if (event === 'data') cb(Buffer.from('mock-pdf-chunk'));
        if (event === 'end') cb();
        return this;
      }),
      registerFont: jest.fn(),
      font: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
      strokeColor: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      end: jest.fn(),
      y: 100,
    })),
  };
});

// Nạp dynamic import
let quizService;
let attemptAggregationService;
let quizReportService;
let quizRepo;
let questionRepo;
let answerRepo;
let userRepo;
let attemptRepo;

beforeAll(async () => {
  quizService = await import('../src/services/quizService.js');
  attemptAggregationService = await import('../src/services/attemptAggregationService.js');
  quizReportService = await import('../src/services/quizReportService.js');
  quizRepo = await import('../src/repositories/quizRepository.js');
  questionRepo = await import('../src/repositories/questionRepository.js');
  answerRepo = await import('../src/repositories/answerRepository.js');
  userRepo = await import('../src/repositories/userRepository.js');
  attemptRepo = await import('../src/repositories/attemptRepository.js');
});

describe('Management APIs - Unit Tests', () => {
  const mockUser = { id: 1, full_name: 'Owner' };
  const mockQuiz = { id: 10, title: 'Test Quiz', creator_id: 1, status: 'DRAFT', grading_scale: 10 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('US: Dashboard kết quả (Results Dashboard)', () => {
    it('Nên trả về dữ liệu dashboard đầy đủ cho chủ Quiz', async () => {
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);
      
      const mockAttempts = [
        { id: 1, user_id: 2, score: 8, started_at: '2023-01-01', finished_at: '2023-01-01', duration_seconds: 60 },
        { id: 2, user_id: 3, score: null, started_at: '2023-01-01', finished_at: null, duration_seconds: null }
      ];
      attemptRepo.getLatestAttemptsByQuizId.mockResolvedValue(mockAttempts);
      attemptRepo.getUserAttemptCountsByQuizId.mockResolvedValue([
        { user_id: 2, total_attempts: 1 },
        { user_id: 3, total_attempts: 1 }
      ]);
      userRepo.findActiveUsersByIds.mockResolvedValue([
        { id: 2, full_name: 'User A', email: 'a@test.com' },
        { id: 3, full_name: 'User B', email: 'b@test.com' }
      ]);
      
      // Mock question evaluation to simplify
      attemptRepo.getAttemptQuestionsByAttemptIds.mockResolvedValue([]);

      const result = await quizService.getResultsDashboard(10, mockUser);

      expect(result.quiz.title).toBe('Test Quiz');
      expect(result.summary.totalParticipants).toBe(2);
      expect(result.summary.submittedCount).toBe(1);
      expect(result.summary.inProgressCount).toBe(1);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].full_name).toBe('User A');
      expect(result.data[0].submission_status).toBe('SUBMITTED');
      expect(result.data[1].submission_status).toBe('IN_PROGRESS');
    });

    it('Nên throw 403 nếu không phải chủ Quiz', async () => {
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);
      const otherUser = { id: 99 };

      await expect(quizService.getResultsDashboard(10, otherUser))
        .rejects.toThrow('Bạn không có quyền thực hiện hành động này');
    });
  });

  describe('US: Bảng xếp hạng (Leaderboard)', () => {
    it('Nên sắp xếp thí sinh theo: Điểm cao -> Thời gian nhanh', async () => {
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);
      
      const mockFinishedAttempts = [
        { id: 1, user_id: 2, score: 9, duration_seconds: 100, finished_at: '2023-01-01T10:00:00Z' },
        { id: 2, user_id: 3, score: 10, duration_seconds: 150, finished_at: '2023-01-01T10:00:00Z' },
        { id: 3, user_id: 4, score: 10, duration_seconds: 120, finished_at: '2023-01-01T10:00:00Z' }, // Thắng id 2 vì tgian nhanh hơn
      ];
      attemptRepo.getFinishedAttemptsByQuizId.mockResolvedValue(mockFinishedAttempts);
      userRepo.findActiveUsersByIds.mockResolvedValue([
        { id: 2, full_name: 'User 2', email: '2@test.com' },
        { id: 3, full_name: 'User 3', email: '3@test.com' },
        { id: 4, full_name: 'User 4', email: '4@test.com' },
      ]);

      const result = await quizService.getLeaderboard(10, mockUser);

      expect(result.data).toHaveLength(3);
      expect(result.data[0].user_id).toBe(4); // 10 điểm, 120s
      expect(result.data[1].user_id).toBe(3); // 10 điểm, 150s
      expect(result.data[2].user_id).toBe(2); // 9 điểm
    });
  });

  describe('US: Thống kê chuyên sâu câu hỏi', () => {
    it('Nên tính toán chính xác tỷ lệ đúng/sai của từng câu hỏi', async () => {
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);
      questionRepo.getListQuestionByQuizId.mockResolvedValue([
        { id: 101, content: 'Q1', type: 'SINGLE_CHOICE' }
      ]);
      
      const mockFinishedAttempts = [{ id: 1, user_id: 2 }];
      attemptRepo.getFinishedAttemptsByQuizId.mockResolvedValue(mockFinishedAttempts);
      
      // Mock flow evaluation
      attemptRepo.getAttemptQuestionsByAttemptIds.mockResolvedValue([
        { id: 501, quiz_attempt_id: 1, content: 'Q1', type: 'SINGLE_CHOICE' }
      ]);
      attemptRepo.getAttemptOptionsByQuestionIds.mockResolvedValue([
        { id: 901, attempt_question_id: 501, is_correct: true }
      ]);
      attemptRepo.getAttemptAnswersByOptionIds.mockResolvedValue([
        { attempt_option_id: 901 } // User chọn đúng
      ]);

      const result = await quizService.getQuestionAnalytics(10, mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].correct_responses).toBe(1);
      expect(result.data[0].correct_rate).toBe(100);
      expect(result.summary.totalAttempts).toBe(1);
    });
  });

  describe('US: Chế độ xem trước (Preview)', () => {
    it('Nên lấy đầy đủ câu hỏi và câu trả lời của Quiz (DRAFT vẫn xem được)', async () => {
      quizRepo.getQuizById.mockResolvedValue(mockQuiz); // creator_id: 1, status: DRAFT
      questionRepo.getListQuestionByQuizId.mockResolvedValue([
        { id: 101, content: 'Q1' }
      ]);
      answerRepo.getAnswersByQuestionIds.mockResolvedValue([
        { id: 201, question_id: 101, content: 'A1', is_correct: true }
      ]);

      const result = await quizService.getQuizPreview(10, mockUser);

      expect(result.quiz.status).toBe('DRAFT');
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].answers).toHaveLength(1);
      expect(result.questions[0].answers[0].content).toBe('A1');
    });
  });

  describe('US: Xuất báo cáo Excel/PDF', () => {
    it('Nên trả về Buffer và Content-Type cho Excel', async () => {
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);
      attemptRepo.getFinishedAttemptsByQuizId.mockResolvedValue([]);

      const report = await quizReportService.buildExcelReport(10, mockUser);

      expect(report.contentType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(Buffer.isBuffer(report.buffer)).toBe(true);
      expect(report.fileName).toContain('test-quiz-report.xlsx');
    });

    it('Nên trả về Buffer và Content-Type cho PDF', async () => {
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);
      attemptRepo.getFinishedAttemptsByQuizId.mockResolvedValue([]);

      // Để tránh lỗi font trong môi trường CI/Test, service có check fonts
      // Chúng ta mock PDFKit nên nó sẽ không thực sự tìm font ngoại ngoại trừ logic check của service.
      // Cần giả lập process.env hoặc mock fs nếu service check file tồn tại.
      
      const report = await quizReportService.buildPdfReport(10, mockUser);

      expect(report.contentType).toBe('application/pdf');
      expect(Buffer.isBuffer(report.buffer)).toBe(true);
      expect(report.fileName).toContain('test-quiz-report.pdf');
    });
  });
});
