import * as questionRepository from '../repositories/questionRepository.js';
import * as answerRepository from '../repositories/answerRepository.js';
import { getQuizById } from '../repositories/quizRepository.js';
import pool from '../db/db.js';
import AppError from '../errors/AppError.js';

const ALLOWED_TYPES = ['ANANSWER', 'MULTI_ANSWERS', 'TRUE_FALSE', 'TEXT'];
const MIN_OPTIONS = 3;
const MAX_OPTIONS = 10;

const buildAnswersByQuestionIdMap = (answers) =>
  answers.reduce((acc, answer) => {
    if (!acc.has(answer.question_id)) {
      acc.set(answer.question_id, []);
    }
    acc.get(answer.question_id).push(answer);
    return acc;
  }, new Map());

/**
 * Validate danh sách đáp án theo từng loại câu hỏi
 */
const validateAnswers = (type, answers) => {
  if (type === 'TEXT') return; // TEXT không cần đáp án

  if (type === 'TRUE_FALSE') {
    if (!answers || answers.length !== 2) {
      throw new AppError('Câu hỏi True/False phải có đúng 2 đáp án (TRUE và FALSE)', 400);
    }
    const correctCount = answers.filter(a => a.isCorrect === true).length;
    if (correctCount !== 1) {
      throw new AppError('Câu hỏi True/False phải có đúng 1 đáp án đúng', 400);
    }
    return;
  }

  // ANANSWER và MULTI_ANSWERS
  if (!answers || answers.length < MIN_OPTIONS || answers.length > MAX_OPTIONS) {
    throw new AppError(
      `Số lượng đáp án phải từ ${MIN_OPTIONS} đến ${MAX_OPTIONS} (hiện có: ${answers?.length ?? 0})`,
      400
    );
  }

  const correctCount = answers.filter(a => a.isCorrect === true).length;
  if (correctCount === 0) {
    throw new AppError('Phải có ít nhất 1 đáp án đúng', 400);
  }

  if (type === 'ANANSWER' && correctCount !== 1) {
    throw new AppError('Câu hỏi một đáp án phải có đúng 1 đáp án đúng', 400);
  }
};

/**
 * Lưu danh sách đáp án vào DB theo questionId
 */
const saveAnswers = async (questionId, answers, tx = pool) => {
  if (!answers || answers.length === 0) return;
  const promises = answers.map(ans =>
    answerRepository.createAnswer({
      content: ans.content,
      isCorrect: ans.isCorrect,
      questionId,
    }, tx)
  );
  await Promise.all(promises);
};

export const createQuestion = async (user, data) => {
  const { content, type, quizId, answers, explanation } = data;

  if (!ALLOWED_TYPES.includes(type)) {
    throw new AppError(`Loại câu hỏi không hợp lệ. Chỉ chấp nhận: ${ALLOWED_TYPES.join(', ')}`, 400);
  }

  validateAnswers(type, answers);

  const quiz = await getQuizById(quizId);
  if (!quiz) throw new AppError('Quiz không tồn tại', 404);
  if (quiz.creator_id != user.id) throw new AppError('Bạn không có quyền thêm câu hỏi vào quiz này', 403);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const questionId = await questionRepository.create({ content, type, quizId, explanation }, conn);
    await saveAnswers(questionId, answers, conn);
    await conn.commit();
    return questionId;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const getListQuestionByQuizId = async (quizId, user) => {
  const quiz = await getQuizById(quizId);
  if (!quiz) throw new AppError('Quiz không tồn tại', 404);

  const isOwner = user && user.id === quiz.creator_id;
  if (!isOwner && quiz.status === 'DRAFT') throw new AppError('Không có quyền', 403);

  const questions = await questionRepository.getListQuestionByQuizId(quizId);

  const answers = await answerRepository.getAnswersByQuestionIds(
    questions.map(q => q.id),
  );
  const answersByQuestionId = buildAnswersByQuestionIdMap(answers);

  return questions.map(q => ({
    ...q,
    answers: answersByQuestionId.get(q.id) || [],
  }));
};

const checkQuestionExistAndOwner = async (questionId, userId) => {
  const question = await questionRepository.findQuestionById(questionId);
  if (!question) throw new AppError('Câu hỏi không tồn tại', 404);

  const quiz = await getQuizById(question.quiz_id);
  if (!quiz) throw new AppError('Quiz liên kết không tồn tại', 404);

  if (quiz.creator_id != userId) {
    throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
  }

  return question;
};

export const updateQuestion = async (questionId, userId, data) => {
  const { type, content, answers, explanation } = data;

  await checkQuestionExistAndOwner(questionId, userId);

  if (type && !ALLOWED_TYPES.includes(type)) {
    throw new AppError(`Loại câu hỏi không hợp lệ`, 400);
  }

  if (type) {
    validateAnswers(type, answers);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Cập nhật content và type
    if (content !== undefined) await questionRepository.changeContent(questionId, content, conn);
    if (type !== undefined) await questionRepository.changeType(questionId, type, conn);
    if (explanation !== undefined) await questionRepository.changeExplanation(questionId, explanation, conn);

    // Replace toàn bộ đáp án cũ nếu có answers mới
    if (answers !== undefined) {
      await answerRepository.deleteAnswersByQuestionId(questionId, conn);
      await saveAnswers(questionId, answers, conn);
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const deleteQuestion = async (questionId, userId) => {
  await checkQuestionExistAndOwner(questionId, userId);
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Xóa đáp án trước (đề phòng không có cascade delete trong DB)
    await answerRepository.deleteAnswersByQuestionId(questionId, conn);
    await questionRepository.deleteQuestionById(questionId, conn);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const checkQuizAccess = (quiz, user) => {
  const isOwner = user && user.id === quiz.creator_id;
  if (!isOwner && (quiz.status === 'DRAFT' || quiz.status === 'PRIVATE')) {
    throw new AppError('Quiz không tồn tại hoặc bạn không có quyền truy cập', 403);
  }
};

export const getQuestionById = async (questionId, user) => {
  const question = await questionRepository.findQuestionById(questionId);
  if (!question) throw new AppError('Question không tồn tại', 404);

  const quiz = await getQuizById(question.quiz_id);
  checkQuizAccess(quiz, user);

  return question;
};

// Các hàm legacy (giữ lại để tương thích)
export const changeType = async (questionId, userId, type) => {
  await checkQuestionExistAndOwner(questionId, userId);
  if (type) {
    if (!ALLOWED_TYPES.includes(type)) throw new AppError('Loại câu hỏi không hợp lệ', 400);
    await questionRepository.changeType(questionId, type);
  }
};

export const changeContent = async (questionId, userId, content) => {
  await checkQuestionExistAndOwner(questionId, userId);
  await questionRepository.changeContent(questionId, content);
};
