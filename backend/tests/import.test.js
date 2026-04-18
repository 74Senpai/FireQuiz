import { jest } from '@jest/globals';

// 1. Mock DB
jest.unstable_mockModule('../src/db/db.js', () => ({
  default: {
    getConnection: jest.fn(),
    execute: jest.fn(),
  }
}));

// 2. Mock Repository
jest.unstable_mockModule('../src/repositories/quizRepository.js', () => ({
  getQuizById: jest.fn(),
}));

// 3. Mock Import Service
jest.unstable_mockModule('../src/services/importService.js', () => ({
  generateTemplateBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-template')),
  parseExcelBuffer: jest.fn(),
  bulkCreateQuestions: jest.fn(),
}));

// Dynamic Imports
let importController;
let importService;
let quizRepo;

beforeAll(async () => {
  importController = await import('../src/controllers/importController.js');
  importService = await import('../src/services/importService.js');
  quizRepo = await import('../src/repositories/quizRepository.js');
});

describe('Import Management - Unit Tests', () => {
  const mockUser = { id: 1 };
  const mockQuiz = { id: 10, creator_id: 1 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadTemplate', () => {
    it('Nên trả về Excel buffer và các header phù hợp', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        send: jest.fn()
      };

      await importController.downloadTemplate(req, res);

      expect(importService.generateTemplateBuffer).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
    });
  });

  describe('importQuestionsFromExcel', () => {
    it('Nên import thành công nếu file hợp lệ', async () => {
      const req = {
        params: { id: '10' },
        user: mockUser,
        file: { buffer: Buffer.from('mock-file') }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      quizRepo.getQuizById.mockResolvedValue(mockQuiz);
      importService.parseExcelBuffer.mockResolvedValue({
        valid: [{ content: 'Q1', type: 'ANANSWER' }],
        invalid: []
      });
      importService.bulkCreateQuestions.mockResolvedValue({ success: 1, failed: 0 });

      // Gọi qua asyncHandler wrapper
      await importController.importQuestionsFromExcel(req, res, next);
      
      // Chờ cho promise trong asyncHandler hoàn tất
      // Vì asyncHandler trả về void, chúng ta cần đợi tick tiếp theo
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(quizRepo.getQuizById).toHaveBeenCalledWith('10');
      expect(importService.parseExcelBuffer).toHaveBeenCalled();
      expect(importService.bulkCreateQuestions).toHaveBeenCalledWith('10', expect.any(Array));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: 1 }));
    });

    it('Nên chặn nếu không có file upload', async () => {
      const req = { params: { id: '10' }, user: mockUser, file: null };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await importController.importQuestionsFromExcel(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Vui lòng upload file .xlsx');
    });

    it('Nên chặn nếu không phải chủ Quiz', async () => {
      const req = {
        params: { id: '10' },
        user: mockUser,
        file: { buffer: Buffer.from('...') }
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      quizRepo.getQuizById.mockResolvedValue({ ...mockQuiz, creator_id: 99 });

      await importController.importQuestionsFromExcel(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Bạn không có quyền import câu hỏi vào quiz này');
    });
  });
});
