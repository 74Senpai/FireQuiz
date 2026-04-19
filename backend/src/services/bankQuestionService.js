import * as bankQuestionRepository from '../repositories/bankQuestionRepository.js';
import * as questionRepository from '../repositories/questionRepository.js';
import * as answerRepository from '../repositories/answerRepository.js';
import { getQuizById } from '../repositories/quizRepository.js';
import pool from '../db/db.js';
import AppError from '../errors/AppError.js';
import * as mediaService from './mediaService.js';

const ALLOWED_TYPES = ['ANANSWER', 'MULTI_ANSWERS', 'TRUE_FALSE', 'TEXT'];
const ALLOWED_DIFFICULTIES = ['easy', 'medium', 'hard'];

const validateAnswers = (type, answers) => {
  if (type === 'TEXT') return;

  if (type === 'TRUE_FALSE') {
    if (!answers || answers.length !== 2)
      throw new AppError('Câu hỏi True/False phải có đúng 2 đáp án', 400);
    if (answers.filter(a => a.isCorrect).length !== 1)
      throw new AppError('Câu hỏi True/False phải có đúng 1 đáp án đúng', 400);
    return;
  }

  if (!answers || answers.length < 3 || answers.length > 10)
    throw new AppError('Số lượng đáp án phải từ 3 đến 10', 400);
  if (!answers.some(a => a.isCorrect))
    throw new AppError('Phải có ít nhất 1 đáp án đúng', 400);
  if (type === 'ANANSWER' && answers.filter(a => a.isCorrect).length !== 1)
    throw new AppError('Câu hỏi một đáp án phải có đúng 1 đáp án đúng', 400);
};

const saveAnswers = async (bankQuestionId, answers, tx = pool) => {
  if (!answers?.length) return;
  await Promise.all(
    answers.map(a =>
      bankQuestionRepository.createAnswer({ content: a.content, isCorrect: a.isCorrect, bankQuestionId }, tx)
    )
  );
};

const buildAnswerMap = (answers) =>
  answers.reduce((map, a) => {
    if (!map.has(a.bank_question_id)) map.set(a.bank_question_id, []);
    map.get(a.bank_question_id).push(a);
    return map;
  }, new Map());

export const createBankQuestion = async (user, { content, type, mediaUrl, difficulty, category, answers }) => {
  if (!ALLOWED_TYPES.includes(type))
    throw new AppError(`Loại câu hỏi không hợp lệ. Chỉ chấp nhận: ${ALLOWED_TYPES.join(', ')}`, 400);
  if (difficulty && !ALLOWED_DIFFICULTIES.includes(difficulty))
    throw new AppError('Độ khó không hợp lệ', 400);

  validateAnswers(type, answers);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const id = await bankQuestionRepository.create(
      { content, type, mediaUrl, difficulty, category, creatorId: user.id },
      conn
    );
    await saveAnswers(id, answers, conn);
    await conn.commit();
    return id;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getBankQuestions = async (user, filters) => {
  const questions = await bankQuestionRepository.findAll({ ...filters, creatorId: user.id });
  const answers = await bankQuestionRepository.findAnswersByQuestionIds(questions.map(q => q.id));
  const answerMap = buildAnswerMap(answers);
  const questionsWithAnswers = questions.map(q => ({ ...q, answers: answerMap.get(q.id) || [] }));
  return await mediaService.hydrateQuestions(questionsWithAnswers);
};

export const getBankQuestionById = async (user, id) => {
  const question = await bankQuestionRepository.findById(id);
  if (!question) throw new AppError('Câu hỏi không tồn tại', 404);
  if (question.creator_id !== user.id) throw new AppError('Bạn không có quyền xem câu hỏi này', 403);

  const answers = await bankQuestionRepository.findAnswersByQuestionIds([id]);
  const [hydrated] = await mediaService.hydrateQuestions([{ ...question, answers }]);
  return hydrated;
};

export const updateBankQuestion = async (user, id, { content, type, mediaUrl, difficulty, category, answers }) => {
  const question = await bankQuestionRepository.findById(id);
  if (!question) throw new AppError('Câu hỏi không tồn tại', 404);
  if (question.creator_id !== user.id) throw new AppError('Bạn không có quyền sửa câu hỏi này', 403);

  const resolvedType = type ?? question.type;
  if (type && !ALLOWED_TYPES.includes(type)) throw new AppError('Loại câu hỏi không hợp lệ', 400);
  if (difficulty && !ALLOWED_DIFFICULTIES.includes(difficulty)) throw new AppError('Độ khó không hợp lệ', 400);
  if (answers !== undefined) validateAnswers(resolvedType, answers);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await bankQuestionRepository.update(id, { content, type, mediaUrl, difficulty, category }, conn);
    if (answers !== undefined) {
      await bankQuestionRepository.deleteAnswersByQuestionId(id, conn);
      await saveAnswers(id, answers, conn);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const deleteBankQuestion = async (user, id) => {
  const question = await bankQuestionRepository.findById(id);
  if (!question) throw new AppError('Câu hỏi không tồn tại', 404);
  if (question.creator_id !== user.id) throw new AppError('Bạn không có quyền xóa câu hỏi này', 403);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await bankQuestionRepository.deleteAnswersByQuestionId(id, conn);
    await bankQuestionRepository.deleteById(id, conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const importFromBank = async (user, quizId, questionIds) => {
  const { getQuizById } = await import('../repositories/quizRepository.js');
  const quiz = await getQuizById(quizId);
  if (!quiz) throw new AppError('Quiz không tồn tại', 404);
  if (quiz.creator_id !== user.id) throw new AppError('Bạn không có quyền thêm câu hỏi vào quiz này', 403);

  const bankQuestions = await bankQuestionRepository.findByIds(questionIds);
  const notFound = questionIds.filter(id => !bankQuestions.find(bq => bq.id === id));
  if (notFound.length) throw new AppError(`Không tìm thấy câu hỏi bank: ${notFound.join(', ')}`, 404);

  const existingIds = await questionRepository.findExistingBankQuestionIds(quizId, questionIds);
  const toImport = bankQuestions.filter(bq => !existingIds.has(bq.id));

  if (!toImport.length) return { createdIds: [], skipped: questionIds.length };

  const answers = await bankQuestionRepository.findAnswersByQuestionIds(toImport.map(bq => bq.id));
  const answerMap = buildAnswerMap(answers);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Pass 1: insert tất cả questions → lấy IDs
    const createdIds = [];
    const bankIdToQuestionId = new Map();
    for (const bq of toImport) {
      const qId = await questionRepository.create(
        { content: bq.content, type: bq.type, quizId, mediaUrl: bq.media_url, bankQuestionId: bq.id },
        conn
      );
      createdIds.push(qId);
      bankIdToQuestionId.set(bq.id, qId);
    }

    // Pass 2: batch insert tất cả answers cùng lúc
    await Promise.all(
      toImport.flatMap(bq =>
        (answerMap.get(bq.id) || []).map(a =>
          answerRepository.createAnswer(
            { content: a.content, isCorrect: a.is_correct, questionId: bankIdToQuestionId.get(bq.id) },
            conn
          )
        )
      )
    );
    await conn.commit();
    return { createdIds, skipped: existingIds.size };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
