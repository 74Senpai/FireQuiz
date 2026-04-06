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
