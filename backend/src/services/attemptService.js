import * as attemptRepository from '../repositories/attemptRepository.js';
import AppError from '../errors/AppError.js';

const buildOptionsByQuestionId = (options) => {
  return options.reduce((acc, option) => {
    if (!acc.has(option.attempt_question_id)) {
      acc.set(option.attempt_question_id, []);
    }
    acc.get(option.attempt_question_id).push(option);
    return acc;
  }, new Map());
};

/**
 * Danh sách lần thi của user hiện tại (quiz_attempts), phân trang.
 */
export const listMyQuizAttempts = async (user, query) => {
  const page = Math.max(1, parseInt(String(query.page), 10) || 1);
  const rawSize = parseInt(String(query.pageSize), 10);
  const pageSize = Number.isFinite(rawSize)
    ? Math.min(100, Math.max(1, rawSize))
    : 10;

  const offset = (page - 1) * pageSize;
  const userId = user.id;

  const [total, rows] = await Promise.all([
    attemptRepository.countQuizAttemptsByUserId(userId),
    attemptRepository.listQuizAttemptsByUserIdPaginated(userId, pageSize, offset),
  ]);

  return {
    data: rows,
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    },
  };
};

/**
 * Chi tiết một lần thi: snapshot câu hỏi / lựa chọn / câu trả lời đã chọn (chỉ khi attempt thuộc user).
 */
export const getMyAttemptReviewDetail = async (user, attemptIdParam) => {
  const attemptId = parseInt(String(attemptIdParam), 10);
  if (!Number.isFinite(attemptId) || attemptId <= 0) {
    throw new AppError('Mã lần thi không hợp lệ', 400);
  }

  const attempt = await attemptRepository.getQuizAttemptByIdAndUserId(attemptId, user.id);
  if (!attempt) {
    throw new AppError('Không tìm thấy lần thi hoặc bạn không có quyền xem', 404);
  }

  const attemptQuestions = await attemptRepository.getAttemptQuestionsByAttemptIds([attemptId]);
  if (!attemptQuestions.length) {
    return {
      attempt,
      questions: [],
    };
  }

  const questionIds = attemptQuestions.map((q) => q.id);
  const attemptOptions =
    await attemptRepository.getAttemptOptionsByQuestionIds(questionIds);
  const optionIds = attemptOptions.map((o) => o.id);
  const attemptAnswers = optionIds.length
    ? await attemptRepository.getAttemptAnswersByOptionIds(optionIds)
    : [];

  const answerByOptionId = new Map(
    attemptAnswers.map((a) => [a.attempt_option_id, a]),
  );
  const optionsByQuestionId = buildOptionsByQuestionId(attemptOptions);

  const questions = attemptQuestions.map((question) => {
    const opts = optionsByQuestionId.get(question.id) || [];
    return {
      id: question.id,
      quiz_attempt_id: question.quiz_attempt_id,
      content: question.content,
      type: question.type,
      options: opts.map((opt) => ({
        id: opt.id,
        attempt_question_id: opt.attempt_question_id,
        content: opt.content,
        is_correct: Boolean(opt.is_correct),
        selected: answerByOptionId.has(opt.id),
        answer: answerByOptionId.get(opt.id) ?? null,
      })),
    };
  });

  return { attempt, questions };
};
import * as quizRepository from '../repositories/quizRepository.js';
import AppError from '../errors/AppError.js';

/**
 * Đồng bộ đáp án tạm thời khi người dùng chọn một option.
 * Chú thích (BE): Kiểm tra attempt hợp lệ và thuộc về user trước khi lưu.
 *
 * @param {number} attemptId         - ID của quiz_attempt
 * @param {number} userId            - ID của user đang làm bài
 * @param {number} attemptQuestionId - ID của attempt_questions
 * @param {number} attemptOptionId   - ID của attempt_options được chọn
 */
export const submitAnswer = async (attemptId, userId, attemptQuestionId, attemptOptionId) => {
  // Chú thích (BE): Kiểm tra attempt có tồn tại không
  const attempt = await attemptRepository.getAttemptById(attemptId);
  if (!attempt) {
    throw new AppError('Không tìm thấy bài làm', 404);
  }

  // Chú thích (BE): Kiểm tra attempt có thuộc về user không
  if (attempt.user_id !== userId) {
    throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
  }

  // Chú thích (BE): Kiểm tra bài chưa nộp (finished_at là null)
  if (attempt.finished_at !== null) {
    throw new AppError('Bài đã nộp, không thể thay đổi đáp án', 400);
  }

  // Chú thích (BE): Lưu đáp án tạm thời (upsert)
  await attemptRepository.upsertAnswer(attemptId, attemptQuestionId, attemptOptionId);
};

export const startAttempt = async (quizId, userId) => {
  const quiz = await quizRepository.getQuizById(quizId);
  if (!quiz) {
    throw new AppError('Quiz không tồn tại', 404);
  }

  if (quiz.status !== 'PUBLIC') {
    throw new AppError('Quiz không công khai', 403);
  }

  const now = new Date();
  if (quiz.available_from && new Date(quiz.available_from) > now) {
    throw new AppError('Quiz chưa mở', 403);
  }
  if (quiz.available_until && new Date(quiz.available_until) < now) {
    throw new AppError('Quiz đã đóng', 403);
  }

  // Chú thích (BE): Kiểm tra xem có bài làm nào đang dang dở không (chưa nộp)
  const activeAttempt = await attemptRepository.getActiveAttempt(quizId, userId);
  
  if (activeAttempt) {
    // Nếu có, tiếp tục bài làm cũ (tránh mất kết quả tự động lưu khi rớt mạng)
    const attemptData = await attemptRepository.getAttemptSnapshot(activeAttempt.id);
    
    // Tính toán thời gian còn lại (nếu có giới hạn thời gian)
    let remainingSeconds = quiz.time_limit_seconds;
    if (remainingSeconds) {
      const elapsedSeconds = Math.floor((now - new Date(activeAttempt.started_at)) / 1000);
      remainingSeconds = Math.max(0, quiz.time_limit_seconds - elapsedSeconds);
    }
    
    return {
      quizTitle: activeAttempt.quiz_title,
      timeLimitSeconds: remainingSeconds,
      ...attemptData
    };
  }

  // Chú thích (BE): Nếu không có bài dang dở, kiểm tra số lần làm bài tối đa
  if (quiz.max_attempts) {
    const attemptsCount = await attemptRepository.countUserAttempts(quizId, userId);
    if (attemptsCount >= quiz.max_attempts) {
      throw new AppError('Bạn đã vượt quá số lần làm bài cho phép', 403);
    }
  }

  const attemptData = await attemptRepository.generateAttemptSnapshot(quizId, userId, quiz.title);
  
  // Trả về dữ liệu để hiển thị trang làm bài
  return {
    quizTitle: quiz.title,
    timeLimitSeconds: quiz.time_limit_seconds,
    ...attemptData
  };
};
