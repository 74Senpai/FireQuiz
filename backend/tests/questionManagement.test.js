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
    execute: jest.fn(),
  }
}));

// 2. Mock Repositories
jest.unstable_mockModule('../src/repositories/quizRepository.js', () => ({
  getQuizById: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/questionRepository.js', () => ({
  create: jest.fn(),
  findQuestionById: jest.fn(),
  changeType: jest.fn(),
  changeContent: jest.fn(),
  changeMediaUrl: jest.fn(),
  changeExplanation: jest.fn(),
  getListQuestionByQuizId: jest.fn(),
  deleteQuestionById: jest.fn(),
}));

jest.unstable_mockModule('../src/repositories/answerRepository.js', () => ({
  createAnswer: jest.fn(),
  deleteAnswersByQuestionId: jest.fn(),
  getAnswersByQuestionIds: jest.fn(),
}));

// 3. Mock Services
jest.unstable_mockModule('../src/services/mediaService.js', () => ({
  deleteFile: jest.fn(),
  hydrateQuestions: jest.fn().mockImplementation((q) => Promise.resolve(q)),
}));

jest.unstable_mockModule('../src/services/supabaseService.js', () => ({
  deleteFileFromSupabase: jest.fn(),
}));

// Dynamic Imports
let questionService;
let quizRepo;
let questionRepo;
let answerRepo;

beforeAll(async () => {
  questionService = await import('../src/services/questionService.js');
  quizRepo = await import('../src/repositories/quizRepository.js');
  questionRepo = await import('../src/repositories/questionRepository.js');
  answerRepo = await import('../src/repositories/answerRepository.js');
});

describe('Question Management - Unit Tests', () => {
  const mockUser = { id: 1 };
  const mockQuiz = { id: 10, creator_id: 1 };
  const mockQuestion = { id: 100, quiz_id: 10, content: 'Q1', type: 'ANANSWER', media_url: 'old.jpg', explanation: 'old exp' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuestion', () => {
    it('Nên tạo câu hỏi mới thành công (ANANSWER)', async () => {
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);
      questionRepo.create.mockResolvedValue(100);

      const data = {
        content: 'New Quest',
        type: 'ANANSWER',
        quizId: 10,
        answers: [
          { content: 'A1', isCorrect: true },
          { content: 'A2', isCorrect: false },
          { content: 'A3', isCorrect: false }
        ],
        mediaUrl: 'new.jpg',
        explanation: 'Some explanation'
      };

      const result = await questionService.createQuestion(mockUser, data);

      expect(quizRepo.getQuizById).toHaveBeenCalledWith(10);
      expect(questionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'New Quest',
          mediaUrl: 'new.jpg',
          explanation: 'Some explanation'
        }),
        expect.anything()
      );
      expect(answerRepo.createAnswer).toHaveBeenCalled();
      expect(result).toBe(100);
    });

    it('Nên cho phép tạo câu hỏi TEXT mà không cần đáp án', async () => {
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);
      questionRepo.create.mockResolvedValue(101);

      const data = {
        content: 'Text Quest',
        type: 'TEXT',
        quizId: 10,
        answers: []
      };

      const result = await questionService.createQuestion(mockUser, data);
      expect(result).toBe(101);
      expect(answerRepo.createAnswer).not.toHaveBeenCalled();
    });

    it('Nên chặn tạo câu hỏi nếu không phải chủ Quiz', async () => {
      quizRepo.getQuizById.mockResolvedValue({ ...mockQuiz, creator_id: 99 });
      
      const data = { 
        content: '...', 
        type: 'ANANSWER', 
        quizId: 10, 
        answers: [
          { content: 'A1', isCorrect: true },
          { content: 'A2', isCorrect: false },
          { content: 'A3', isCorrect: false }
        ] 
      };

      await expect(questionService.createQuestion(mockUser, data))
        .rejects.toThrow('Bạn không có quyền thêm câu hỏi vào quiz này');
    });
  });

  describe('updateQuestion', () => {
    it('Nên cập nhật nội dung và lời giải thích thành công', async () => {
      questionRepo.findQuestionById.mockResolvedValue(mockQuestion);
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);

      const updateData = {
        content: 'Updated Content',
        explanation: 'Updated Explanation'
      };

      await questionService.updateQuestion(100, 1, updateData);

      expect(questionRepo.changeContent).toHaveBeenCalledWith(100, 'Updated Content', expect.anything());
      expect(questionRepo.changeExplanation).toHaveBeenCalledWith(100, 'Updated Explanation', expect.anything());
    });

    it('Nên không làm gì nếu không có dữ liệu cập nhật', async () => {
      questionRepo.findQuestionById.mockResolvedValue(mockQuestion);
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);

      await questionService.updateQuestion(100, 1, {});

      expect(questionRepo.changeContent).not.toHaveBeenCalled();
      expect(answerRepo.deleteAnswersByQuestionId).not.toHaveBeenCalled();
    });
  });

  describe('deleteQuestion', () => {
    it('Nên xóa câu hỏi thành công', async () => {
      questionRepo.findQuestionById.mockResolvedValue(mockQuestion);
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);

      await questionService.deleteQuestion(100, 1);

      expect(questionRepo.deleteQuestionById).toHaveBeenCalledWith(100, expect.anything());
    });
  });

  describe('getListQuestionByQuizId', () => {
    it('Nên trả về danh sách câu hỏi kèm đáp án', async () => {
      quizRepo.getQuizById.mockResolvedValue(mockQuiz);
      questionRepo.getListQuestionByQuizId.mockResolvedValue([
        { id: 100, content: 'Q1', type: 'ANANSWER' }
      ]);
      answerRepo.getAnswersByQuestionIds.mockResolvedValue([
        { id: 200, question_id: 100, content: 'A1', is_correct: 1 }
      ]);

      const result = await questionService.getListQuestionByQuizId(10, mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].answers).toHaveLength(1);
      expect(result[0].answers[0].content).toBe('A1');
    });
  });
});
