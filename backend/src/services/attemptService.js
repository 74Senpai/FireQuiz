import * as attemptRepository from '../repositories/attemptRepository.js';
import * as quizRepository from '../repositories/quizRepository.js';
import pool from '../db/db.js';
import AppError from '../errors/AppError.js';
import * as mediaService from './mediaService.js';
import { buildDraftKey, delCache } from '../cache/cacheClient.js';


const buildOptionsByQuestionId = (options) => {
  return options.reduce((acc, option) => {
    if (!acc.has(option.attempt_question_id)) {
      acc.set(option.attempt_question_id, []);
    }
    acc.get(option.attempt_question_id).push(option);
    return acc;
  }, new Map());
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
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
      media_url: question.media_url,
      explanation: question.explanation,
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

  const quiz = await quizRepository.getQuizById(attempt.quiz_id);
  const hydratedQuestions = await mediaService.hydrateQuestions(questions);

  return { attempt, questions: hydratedQuestions };
};

const generateAttemptSnapshot = async (quiz, userId) => {
  const quizId = quiz.id;
  const quizTitle = quiz.title;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Phân tích câu hỏi và đáp án
    const rows = await attemptRepository.getQuestionsAndAnswersByQuizId(conn, quizId);

    // Group
    const questionsMap = new Map();
    for (const row of rows) {
      if (!row.question_id) continue;

      if (!questionsMap.has(row.question_id)) {
        questionsMap.set(row.question_id, {
          content: row.question_content,
          type: row.question_type,
          mediaUrl: row.question_media_url,
          explanation: row.question_explanation,
          answers: []
        });
      }

      if (row.answer_id) {
        questionsMap.get(row.question_id).answers.push({
          content: row.answer_content,
          is_correct: row.answer_is_correct
        });
      }
    }

    const groupedQuestions = Array.from(questionsMap.values());
    shuffleArray(groupedQuestions);

    // 2. Insert quiz_attempts
    const attemptId = await attemptRepository.createQuizAttempt(conn, userId, quizId, quizTitle);

    if (groupedQuestions.length === 0) {
      await conn.commit();
      return { attemptId, questions: [] };
    }

    // 3. Bulk insert attempt_questions
    const attemptQuestionsPayload = groupedQuestions.map(q => [attemptId, q.content, q.type, q.mediaUrl]);
    const aqResult = await attemptRepository.bulkInsertAttemptQuestions(conn, attemptQuestionsPayload);

    let currentAqId = aqResult.insertId;
    const attemptOptionsPayload = [];
    const questionsData = [];

    // Gán ID cho câu hỏi và chuẩn bị bulk insert options
    for (const q of groupedQuestions) {
      const aqId = currentAqId++;

      shuffleArray(q.answers);

      q.aqId = aqId;
      q.optionsCount = q.answers.length;

      for (const a of q.answers) {
        attemptOptionsPayload.push([aqId, a.content, a.is_correct]);
      }
    }

    if (attemptOptionsPayload.length > 0) {
      // 4. Bulk insert attempt_options
      const aoResult = await attemptRepository.bulkInsertAttemptOptions(conn, attemptOptionsPayload);
      let currentAoId = aoResult.insertId;

      // 5. Gán ID cho options và format chuẩn trả về client
      for (const q of groupedQuestions) {
        const optionsData = [];
        for (let i = 0; i < q.optionsCount; i++) {
          const optId = currentAoId++;
          optionsData.push({
            id: optId,
            text: q.answers[i].content
          });
        }
        questionsData.push({
          id: q.aqId,
          text: q.content,
          type: q.type,
          media_url: q.mediaUrl,
          options: optionsData
        });
      }
    } else {
      // Nếu không có options nào
      for (const q of groupedQuestions) {
        questionsData.push({
          id: q.aqId,
          text: q.content,
          type: q.type,
          media_url: q.mediaUrl,
          options: []
        });
      }
    }

    const expiresSeconds = (quiz.time_limit_seconds || 3600) + 300;
    const hydratedQuestions = await mediaService.hydrateQuestions(questionsData, expiresSeconds);

    await conn.commit();
    return {
      attemptId,
      questions: hydratedQuestions
    };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Đồng bộ đáp án tạm thời khi người dùng chọn một hoặc nhiều option.
 */
export const submitAnswer = async (attemptId, userId, attemptQuestionId, attemptOptionIds, textAnswer = null) => {
  const attempt = await attemptRepository.getQuizAttemptById(attemptId);
  if (!attempt) {
    throw new AppError('Không tìm thấy bài làm', 404);
  }

  if (attempt.user_id !== userId) {
    throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
  }

  if (attempt.finished_at !== null) {
    throw new AppError('Bài đã nộp, không thể thay đổi đáp án', 400);
  }

  const quiz = await quizRepository.getQuizById(attempt.quiz_id);
  if (quiz && quiz.time_limit_seconds) {
    const now = new Date();
    const startedAt = new Date(attempt.started_at);
    const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    if (elapsedSeconds > quiz.time_limit_seconds + 5) {
      throw new AppError('Đã hết thời gian làm bài, không thể lưu thêm đáp án', 400);
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await attemptRepository.deleteAttemptAnswers(conn, attemptQuestionId);

    // Đảm bảo attemptOptionIds là array
    const ids = Array.isArray(attemptOptionIds) ? attemptOptionIds : [attemptOptionIds];

    if (ids.length > 0) {
      const answersPayload = ids.map((id, index) => ({
        attemptOptionId: id,
        textAnswer: index === 0 ? textAnswer : null
      }));
      await attemptRepository.bulkInsertAttemptAnswers(conn, answersPayload);
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const startAttempt = async (quizId, userId) => {
  const quiz = await quizRepository.getQuizById(quizId);
  if (!quiz) {
    throw new AppError('Quiz không tồn tại', 404);
  }

  const now = new Date();
  const isBeforeOpen = quiz.available_from && new Date(quiz.available_from) > now;
  const isAfterClose = quiz.available_until && new Date(quiz.available_until) < now;

  const hasSchedule = quiz.available_from || quiz.available_until;
  const isDateValid = !isBeforeOpen && !isAfterClose;

  if (hasSchedule) {
    if (isDateValid && quiz.status !== 'PUBLIC' && quiz.status !== 'DELETED') {
      await quizRepository.setStatus(quizId, 'PUBLIC');
      quiz.status = 'PUBLIC';
    } else if (!isDateValid && quiz.status === 'PUBLIC') {
      await quizRepository.setStatus(quizId, 'PRIVATE');
      quiz.status = 'PRIVATE';
    }
  }

  if (isBeforeOpen) {
    throw new AppError('Quiz chưa mở', 403);
  }
  if (isAfterClose) {
    throw new AppError('Quiz đã đóng', 403);
  }
  if (quiz.status !== 'PUBLIC') {
    throw new AppError('Quiz không công khai', 403);
  }

  const activeAttempt = await attemptRepository.getActiveAttempt(quizId, userId);

  if (activeAttempt) {
    const hydratedData = await attemptRepository.getAttemptSnapshot(activeAttempt.id);
    let remainingSeconds = quiz.time_limit_seconds;
    if (remainingSeconds) {
      const elapsedSeconds = Math.floor((now.getTime() - new Date(activeAttempt.started_at).getTime()) / 1000);
      remainingSeconds = Math.max(0, quiz.time_limit_seconds - elapsedSeconds);
    }

    const expiresSeconds = (quiz.time_limit_seconds || 3600) + 300;
    const hydratedQuestions = await mediaService.hydrateQuestions(hydratedData.questions, expiresSeconds);

    return {
      quizTitle: activeAttempt.quiz_title,
      timeLimitSeconds: remainingSeconds,
      maxTabViolations: quiz.max_tab_violations ?? 2,
      ...hydratedData,
      questions: hydratedQuestions
    };
  }

  if (quiz.max_attempts) {
    const totalAttempts = await attemptRepository.countTotalAttempts(quizId);
    if (totalAttempts >= quiz.max_attempts) {
      throw new AppError('Đã hết số lượt tham gia giới hạn của bài trắc nghiệm này', 403);
    }
  }

  if (quiz.max_attempts_per_user) {
    const userAttemptsCount = await attemptRepository.countQuizAttemptsByUserAndQuiz(userId, quizId);
    if (userAttemptsCount >= quiz.max_attempts_per_user) {
      throw new AppError('Bạn đã dùng hết số lượt làm bài cho phép đối với Quiz này', 403);
    }
  }

  const attemptData = await generateAttemptSnapshot(quiz, userId);

  return {
    quizTitle: quiz.title,
    timeLimitSeconds: quiz.time_limit_seconds,
    maxTabViolations: quiz.max_tab_violations ?? 2,
    ...attemptData
  };
};

/**
 * Nộp bài chính thức (Option A):
 * - FE gửi kèm toàn bộ answers + textAnswers trong request body
 * - BE validate, ghi hàng loạt vào DB, tính điểm, xóa cache draft
 *
 * @param {number} attemptId
 * @param {number} userId
 * @param {Object} answers        - { [attemptQuestionId]: [attemptOptionId, ...] }
 * @param {Object} textAnswers    - { [attemptQuestionId]: string } (câu TEXT)
 */
export const finishAttempt = async (attemptId, userId, answers = {}, textAnswers = {}) => {
  const attempt = await attemptRepository.getQuizAttemptById(attemptId);
  if (!attempt) {
    throw new AppError('Không tìm thấy bài làm', 404);
  }

  if (attempt.user_id !== userId) {
    throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
  }

  if (attempt.finished_at !== null) {
    return { message: 'Bài đã được nộp trước đó' };
  }

  const quiz = await quizRepository.getQuizById(attempt.quiz_id);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Bước 1: Fetch toàn bộ attempt_options của attempt này trong 1 query duy nhất
    const allOptions = await attemptRepository.getAllOptionsByAttemptId(conn, attemptId);

    // Bước 2: Build map: attemptQuestionId => [{ id, ... }, ...]
    // Đây đồng thời là whitelist các questionId/optionId hợp lệ cho attempt này.
    const optionsByQId = new Map();
    const validOptionIds = new Set(); // Tập hợp option IDs hợp lệ (chống IDOR)
    for (const opt of allOptions) {
      if (!optionsByQId.has(opt.attempt_question_id)) {
        optionsByQId.set(opt.attempt_question_id, []);
      }
      optionsByQId.get(opt.attempt_question_id).push(opt);
      validOptionIds.add(opt.id);
    }

    // Bước 3: Gom toàn bộ option IDs cần xóa và payload cần insert
    const optionIdsToDelete = [];
    const insertPayload = [];

    // Xử lý câu có option (SINGLE_CHOICE, MULTIPLE_CHOICE, ...)
    for (const [qIdStr, optionIds] of Object.entries(answers)) {
      const attemptQuestionId = Number(qIdStr);
      if (!Number.isFinite(attemptQuestionId)) continue;

      // [SECURITY] Bỏ qua bất kỳ questionId nào không thuộc attempt này
      if (!optionsByQId.has(attemptQuestionId)) continue;

      const existingOpts = optionsByQId.get(attemptQuestionId);
      existingOpts.forEach(o => optionIdsToDelete.push(o.id));

      const ids = Array.isArray(optionIds)
        ? optionIds
            .map(Number)
            .filter((id) => Number.isFinite(id) && validOptionIds.has(id)) // [SECURITY] chỉ chấp nhận optionId hợp lệ
        : [];

      if (ids.length > 0) {
        const textValue = textAnswers[qIdStr] || null;
        ids.forEach((id, index) => {
          insertPayload.push({
            attemptOptionId: id,
            textAnswer: index === 0 ? textValue : null,
          });
        });
      }
    }

    // Xử lý câu TEXT (không có option chọn, chỉ có text)
    for (const [qIdStr, textValue] of Object.entries(textAnswers)) {
      if (answers[qIdStr]) continue; // đã xử lý ở trên
      const attemptQuestionId = Number(qIdStr);
      if (!Number.isFinite(attemptQuestionId)) continue;

      // [SECURITY] Bỏ qua bất kỳ questionId nào không thuộc attempt này
      if (!optionsByQId.has(attemptQuestionId)) continue;

      const existingOpts = optionsByQId.get(attemptQuestionId);
      existingOpts.forEach(o => optionIdsToDelete.push(o.id));

      // Gắn textAnswer vào option đầu tiên của câu TEXT (lấy từ map, không cần query DB)
      if (existingOpts.length > 0) {
        insertPayload.push({
          attemptOptionId: existingOpts[0].id,
          textAnswer: textValue || null,
        });
      }
    }

    // Bước 4: 1 bulk DELETE duy nhất cho toàn bộ câu hỏi được cập nhật
    await attemptRepository.bulkDeleteAttemptAnswersByOptionIds(conn, optionIdsToDelete);

    // Bước 5: 1 bulk INSERT duy nhất cho toàn bộ đáp án mới
    await attemptRepository.bulkInsertAttemptAnswers(conn, insertPayload);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Tính điểm
  const scoreData = await attemptRepository.getAttemptScoreData(attemptId);
  let finalScore = 0;
  if (scoreData.total > 0) {
    const gradingScale = quiz.grading_scale || 10;
    finalScore = (scoreData.correct / scoreData.total) * gradingScale;
  }
  finalScore = Math.round(finalScore * 100) / 100;

  await attemptRepository.markAttemptFinished(attemptId, finalScore);

  // Xóa cache draft sau khi đã ghi DB thành công
  delCache(buildDraftKey(attempt.quiz_id, userId));

  return {
    message: 'Nộp bài thành công',
    score: finalScore,
    correct: scoreData.correct,
    total: scoreData.total,
  };
};

export const recordTabViolation = async (attemptId, userId) => {
  const attempt = await attemptRepository.getQuizAttemptById(attemptId);
  if (!attempt) {
    throw new AppError('Không tìm thấy bài làm', 404);
  }

  if (attempt.user_id !== userId) {
    throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
  }

  await attemptRepository.incrementTabViolation(attemptId);
};

export const joinQuizByCode = async (code, userId) => {
  const quiz = await quizRepository.getQuizByCode(code);
  if (!quiz) {
    throw new AppError("Mã PIN không chính xác", 404);
  }

  await startAttempt(quiz.id, userId);

  return quiz;
};

/**
 * Thống kê lịch sử thi cho user hiện tại
 */
export const getMyHistoryStats = async (user) => {
  return await attemptRepository.getHistoryStatsByUserId(user.id);
};

