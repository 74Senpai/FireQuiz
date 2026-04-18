import pool from '../db/db.js';

/**
 * Lấy toàn bộ attempt_options của một attempt (dùng cho finishAttempt bulk-mode)
 */
export const getAllOptionsByAttemptId = async (conn, attemptId) => {
  const [rows] = await conn.execute(
    `SELECT ao.id, ao.attempt_question_id
     FROM attempt_options ao
     JOIN attempt_questions aq ON ao.attempt_question_id = aq.id
     WHERE aq.quiz_attempt_id = ?`,
    [attemptId]
  );
  return rows;
};

/**
 * Xóa toàn bộ đáp án của một attempt bằng JOIN, tránh IN clause dài
 */
export const deleteAllAttemptAnswersByAttemptId = async (conn, attemptId) => {
  await conn.execute(
    `DELETE aa FROM attempt_answers aa
     JOIN attempt_options ao ON aa.attempt_option_id = ao.id
     JOIN attempt_questions aq ON ao.attempt_question_id = aq.id
     WHERE aq.quiz_attempt_id = ?`,
    [attemptId]
  );
};

/**
 * Xoá đáp án tạm thời của một câu hỏi trong một bài làm
 */
export const deleteAttemptAnswers = async (conn, attemptQuestionId) => {
  const [options] = await conn.execute(
    `SELECT id FROM attempt_options WHERE attempt_question_id = ?`,
    [attemptQuestionId]
  );
  if (options.length > 0) {
    const optionIds = options.map(o => o.id);
    const placeholders = optionIds.map(() => '?').join(',');
    await conn.execute(
      `DELETE FROM attempt_answers WHERE attempt_option_id IN (${placeholders})`,
      optionIds
    );
  }
};

/**
 * Lưu đáp án tạm thời mới (đơn lẻ)
 */
export const insertAttemptAnswer = async (conn, attemptOptionId, textAnswer = null) => {
  await conn.execute(
    `INSERT INTO attempt_answers (attempt_option_id, text_answer) VALUES (?, ?)`,
    [attemptOptionId, textAnswer]
  );
};

/**
 * Lưu đáp án tạm thời mới (hàng loạt)
 */
export const bulkInsertAttemptAnswers = async (conn, attemptAnswers) => {
  if (attemptAnswers.length === 0) return;
  // attemptAnswers should be an array of objects: { attemptOptionId, textAnswer }
  const values = attemptAnswers.map(a => [a.attemptOptionId, a.textAnswer || null]);
  await conn.query(
    `INSERT INTO attempt_answers (attempt_option_id, text_answer) VALUES ?`,
    [values]
  );
};

/**
 * Lấy thông tin bài làm theo ID
 */
export const getQuizAttemptById = async (attemptId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM quiz_attempts WHERE id = ?`,
    [attemptId]
  );
  return rows[0] || null;
};

/**
 * Đếm tổng số lần tham gia của một Quiz
 */
export const countTotalAttempts = async (quizId) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_id = ?`,
    [quizId]
  );
  return rows[0].count;
};

/**
 * Tạo mới một bản ghi quiz_attempt
 */
export const createQuizAttempt = async (conn, userId, quizId, quizTitle) => {
  const [result] = await conn.execute(
    `INSERT INTO quiz_attempts (user_id, quiz_id, quiz_title, started_at) VALUES (?, ?, ?, NOW())`,
    [userId, quizId, quizTitle]
  );
  return result.insertId;
};

/**
 * Lấy danh sách câu hỏi và đáp án gốc của Quiz để tạo snapshot
 */
export const getQuestionsAndAnswersByQuizId = async (conn, quizId) => {
  const [rows] = await conn.execute(
    `SELECT q.id as question_id, q.content as question_content, q.type as question_type, q.media_url as question_media_url, q.explanation as question_explanation,
            a.id as answer_id, a.content as answer_content, a.is_correct as answer_is_correct
     FROM questions q
     LEFT JOIN answers a ON q.id = a.question_id
     WHERE q.quiz_id = ?`,
    [quizId]
  );
  return rows;
};

/**
 * Lưu hàng loạt câu hỏi vào snapshot bài làm
 */
export const bulkInsertAttemptQuestions = async (conn, questionsData) => {
  if (questionsData.length === 0) return null;
  const [result] = await conn.query(
    `INSERT INTO attempt_questions (quiz_attempt_id, content, type, media_url, explanation) VALUES ?`,
    [questionsData]
  );
  return result;
};

/**
 * Lưu hàng loạt lựa chọn vào snapshot bài làm
 */
export const bulkInsertAttemptOptions = async (conn, optionsData) => {
  if (optionsData.length === 0) return null;
  const [result] = await conn.query(
    `INSERT INTO attempt_options (attempt_question_id, content, is_correct) VALUES ?`,
    [optionsData]
  );
  return result;
};

/**
 * Lấy bài làm đang diễn ra (chưa nộp) của user
 */
export const getActiveAttempt = async (quizId, userId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1`,
    [userId, quizId]
  );
  return rows[0] || null;
};

/**
 * Láy toàn bộ dữ liệu snapshot của bài làm dang dở bao gồm đáp án đã chọn
 */
export const getAttemptSnapshot = async (attemptId) => {
  const [questions] = await pool.execute(
    `SELECT id, content, type, media_url, explanation FROM attempt_questions WHERE quiz_attempt_id = ?`,
    [attemptId]
  );

  const questionsData = [];

  for (const q of questions) {
    const [options] = await pool.execute(
      `SELECT id, content FROM attempt_options WHERE attempt_question_id = ?`,
      [q.id]
    );

    const [answers] = await pool.execute(
      `SELECT attempt_option_id, text_answer FROM attempt_answers 
       WHERE attempt_option_id IN (SELECT id FROM attempt_options WHERE attempt_question_id = ?)`,
      [q.id]
    );

    const optionsData = options.map(o => ({
      id: o.id,
      text: o.content
    }));

    const selectedOptionIds = answers.map(a => a.attempt_option_id);
    const textAnswer = answers.length > 0 ? answers[0].text_answer : null;

    questionsData.push({
      id: q.id,
      text: q.content,
      type: q.type,
      media_url: q.media_url,
      explanation: q.explanation,
      options: optionsData,
      selectedOptionIds: selectedOptionIds,
      textAnswer: textAnswer
    });
  }

  return {
    attemptId,
    questions: questionsData
  };
};

/**
 * Lấy số lượng câu hỏi và số câu trả lời đúng để tính điểm
 */
export const getAttemptScoreData = async (conn, attemptId) => {
  const [totalRows] = await conn.execute(
    `SELECT COUNT(*) as total FROM attempt_questions WHERE quiz_attempt_id = ?`,
    [attemptId]
  );

  const [correctRows] = await conn.execute(
    `SELECT COUNT(*) as correct
     FROM attempt_answers aa
     JOIN attempt_options ao ON aa.attempt_option_id = ao.id
     JOIN attempt_questions aq ON ao.attempt_question_id = aq.id
     WHERE aq.quiz_attempt_id = ? AND ao.is_correct = 1`,
    [attemptId]
  );

  return {
    total: totalRows[0].total,
    correct: correctRows[0].correct
  };
};

/**
 * Đánh dấu bài làm là hoàn thành
 */
export const markAttemptFinished = async (conn, attemptId, score) => {
  await conn.execute(
    `UPDATE quiz_attempts SET finished_at = NOW(), score = ? WHERE id = ?`,
    [score, attemptId]
  );
};

/**
 * Ghi nhận vi phạm chuyển tab
 */
export const incrementTabViolation = async (attemptId) => {
  await pool.execute(
    `UPDATE quiz_attempts SET tab_violations = tab_violations + 1 WHERE id = ?`,
    [attemptId]
  );
};

/**
 * Đếm số lần tham gia Quiz của một User
 */
export const countQuizAttemptsByUserId = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM quiz_attempts WHERE user_id = ?`,
    [userId]
  );
  return Number(rows[0]?.total) || 0;
};

/**
 * Đếm số lần tham gia của một User cho một Quiz cụ thể
 */
export const countQuizAttemptsByUserAndQuiz = async (userId, quizId) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?`,
    [userId, quizId]
  );
  return Number(rows[0]?.total) || 0;
};

/**
 * Lấy danh sách lịch sử thi của User (phân trang)
 */
export const listQuizAttemptsByUserIdPaginated = async (userId, limit, offset) => {
  const sql = `
    SELECT
      qa.id, qa.user_id, qa.quiz_id, qa.quiz_title, qa.score, qa.started_at, qa.finished_at,
      CASE
        WHEN qa.finished_at IS NULL THEN NULL
        ELSE TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at)
      END AS duration_seconds
    FROM quiz_attempts qa
    WHERE qa.user_id = ?
    ORDER BY qa.started_at DESC, qa.id DESC
    LIMIT ? OFFSET ?;
  `;
  const [rows] = await pool.query(sql, [userId, limit, offset]);
  return rows;
};

/**
 * Lấy thống kê điểm số theo thời gian để vẽ biểu đồ
 */
export const getHistoryStatsByUserId = async (userId) => {
  const sql = `
    SELECT 
      quiz_title, 
      score, 
      finished_at 
    FROM quiz_attempts 
    WHERE user_id = ? AND finished_at IS NOT NULL 
    ORDER BY finished_at ASC;
  `;
  const [rows] = await pool.execute(sql, [userId]);
  return rows;
};


/**
 * Lấy một lần thi cụ thể để review
 */
export const getQuizAttemptByIdAndUserId = async (attemptId, userId) => {
  const sql = `
    SELECT
      qa.id, qa.user_id, qa.quiz_id, qa.quiz_title, qa.score,
      qa.started_at, qa.finished_at, qa.tab_violations,
      CASE
        WHEN qa.finished_at IS NULL THEN NULL
        ELSE TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at)
      END AS duration_seconds
    FROM quiz_attempts qa
    WHERE qa.id = ? AND qa.user_id = ?
    LIMIT 1;
  `;
  const [rows] = await pool.execute(sql, [attemptId, userId]);
  return rows[0] || null;
};

/**
 * Lấy snapshot các câu hỏi của lần thi
 */
export const getAttemptQuestionsByAttemptIds = async (attemptIds) => {
  if (!attemptIds.length) return [];
  const placeholders = attemptIds.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT * FROM attempt_questions WHERE quiz_attempt_id IN (${placeholders})`,
    attemptIds
  );
  return rows;
};

/**
 * Lấy snapshot các lựa chọn của danh sách câu hỏi
 */
export const getAttemptOptionsByQuestionIds = async (questionIds) => {
  if (!questionIds.length) return [];
  const placeholders = questionIds.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT * FROM attempt_options WHERE attempt_question_id IN (${placeholders})`,
    questionIds
  );
  return rows;
};

/**
 * Lấy đáp án đã chọn trong một lần thi
 */
export const getAttemptAnswersByOptionIds = async (optionIds) => {
  if (!optionIds.length) return [];
  const placeholders = optionIds.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT * FROM attempt_answers WHERE attempt_option_id IN (${placeholders})`,
    optionIds
  );
  return rows;
};

/**
 * Lấy tất cả các lần thi đã hoàn thành của một Quiz (Leaderboard/Analytics)
 */
export const getFinishedAttemptsByQuizId = async (quizId) => {
  const sql = `
    SELECT 
      id, user_id, quiz_id, score, started_at, finished_at, tab_violations,
      TIMESTAMPDIFF(SECOND, started_at, finished_at) AS duration_seconds
    FROM quiz_attempts
    WHERE quiz_id = ? AND finished_at IS NOT NULL
    ORDER BY started_at DESC;
  `;
  const [rows] = await pool.execute(sql, [quizId]);
  return rows;
};

/**
 * Lấy lần thi mới nhất của mỗi user cho một Quiz (Dashboard)
 */
export const getLatestAttemptsByQuizId = async (quizId) => {
  const sql = `
    SELECT 
      qa.id, qa.user_id, qa.quiz_id, qa.score, qa.started_at, qa.finished_at,
      qa.tab_violations,
      CASE 
        WHEN qa.finished_at IS NULL THEN NULL
        ELSE TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at)
      END AS duration_seconds
    FROM quiz_attempts qa
    INNER JOIN (
      SELECT user_id, MAX(started_at) as max_started_at
      FROM quiz_attempts
      WHERE quiz_id = ?
      GROUP BY user_id
    ) latest ON qa.user_id = latest.user_id AND qa.started_at = latest.max_started_at
    WHERE qa.quiz_id = ?;
  `;
  const [rows] = await pool.execute(sql, [quizId, quizId]);
  return rows;
};

/**
 * Đếm số lần tham gia của mỗi user cho một Quiz
 */
export const getUserAttemptCountsByQuizId = async (quizId) => {
  const sql = `
    SELECT user_id, COUNT(*) as total_attempts
    FROM quiz_attempts
    WHERE quiz_id = ?
    GROUP BY user_id;
  `;
  const [rows] = await pool.execute(sql, [quizId]);
  return rows;
};
