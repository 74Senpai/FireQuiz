import pool from '../db/db.js';

const buildPlaceholders = (values) => values.map(() => '?').join(', ');

export const getFinishedAttemptsByQuizId = async (quizId) => {
  const sql = `
    SELECT
      qa.id,
      qa.user_id,
      qa.quiz_id,
      qa.score,
      qa.started_at,
      qa.finished_at,
      TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at) AS duration_seconds
    FROM quiz_attempts qa
    WHERE qa.quiz_id = ?
      AND qa.finished_at IS NOT NULL;
  `;

  const [rows] = await pool.execute(sql, [quizId]);
  return rows;
};

export const getLatestAttemptsByQuizId = async (quizId) => {
  const sql = `
    WITH ranked_attempts AS (
      SELECT
        qa.id,
        qa.user_id,
        qa.quiz_id,
        qa.score,
        qa.started_at,
        qa.finished_at,
        CASE
          WHEN qa.finished_at IS NULL THEN NULL
          ELSE TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at)
        END AS duration_seconds,
        ROW_NUMBER() OVER (
          PARTITION BY qa.user_id
          ORDER BY qa.created_at DESC, qa.id DESC
        ) AS rn
      FROM quiz_attempts qa
      WHERE qa.quiz_id = ?
    )
    SELECT *
    FROM ranked_attempts
    WHERE rn = 1;
  `;

  const [rows] = await pool.execute(sql, [quizId]);
  return rows;
};

export const getUserAttemptCountsByQuizId = async (quizId) => {
  const sql = `
    SELECT
      qa.user_id,
      COUNT(*) AS total_attempts
    FROM quiz_attempts qa
    WHERE qa.quiz_id = ?
    GROUP BY qa.user_id;
  `;

  const [rows] = await pool.execute(sql, [quizId]);
  return rows;
};

export const getAttemptQuestionsByAttemptIds = async (attemptIds) => {
  if (!attemptIds.length) {
    return [];
  }

  const placeholders = buildPlaceholders(attemptIds);
  const sql = `
    SELECT
      aq.id,
      aq.quiz_attempt_id,
      aq.content,
      aq.type
    FROM attempt_questions aq
    WHERE aq.quiz_attempt_id IN (${placeholders});
  `;

  const [rows] = await pool.execute(sql, attemptIds);
  return rows;
};

export const getAttemptOptionsByQuestionIds = async (questionIds) => {
  if (!questionIds.length) {
    return [];
  }

  const placeholders = buildPlaceholders(questionIds);
  const sql = `
    SELECT
      ao.id,
      ao.attempt_question_id,
      ao.content,
      ao.is_correct
    FROM attempt_options ao
    WHERE ao.attempt_question_id IN (${placeholders});
  `;

  const [rows] = await pool.execute(sql, questionIds);
  return rows;
};

export const getAttemptAnswersByOptionIds = async (optionIds) => {
  if (!optionIds.length) {
    return [];
  }

  const placeholders = buildPlaceholders(optionIds);
  const sql = `
    SELECT
      aa.id,
      aa.attempt_option_id,
      aa.text_answer
    FROM attempt_answers aa
    WHERE aa.attempt_option_id IN (${placeholders});
  `;

  const [rows] = await pool.execute(sql, optionIds);
  return rows;
};

export const countQuizAttemptsByUserId = async (userId) => {
  const sql = `
    SELECT COUNT(*) AS total
    FROM quiz_attempts
    WHERE user_id = ?;
  `;
  const [rows] = await pool.execute(sql, [userId]);
  const total = rows[0]?.total ?? 0;
  return Number(total) || 0;
};

export const listQuizAttemptsByUserIdPaginated = async (userId, limit, offset) => {
  const sql = `
    SELECT
      qa.id,
      qa.user_id,
      qa.quiz_id,
      qa.quiz_title,
      qa.score,
      qa.started_at,
      qa.finished_at,
      qa.created_at,
      qa.updated_at,
      CASE
        WHEN qa.finished_at IS NULL THEN NULL
        ELSE TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at)
      END AS duration_seconds
    FROM quiz_attempts qa
    WHERE qa.user_id = ?
    ORDER BY qa.started_at DESC, qa.id DESC
    LIMIT ? OFFSET ?;
  `;
  const [rows] = await pool.execute(sql, [userId, limit, offset]);
  return rows;
};

/** Một lần thi thuộc về user (không lọc DELETED quiz — attempt vẫn hợp lệ). */
export const getQuizAttemptByIdAndUserId = async (attemptId, userId) => {
  const sql = `
    SELECT
      qa.id,
      qa.user_id,
      qa.quiz_id,
      qa.quiz_title,
      qa.score,
      qa.started_at,
      qa.finished_at,
      qa.created_at,
      qa.updated_at,
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
 * Upsert đáp án tạm thời: xoá đáp án cũ của câu hỏi rồi insert đáp án mới.
 * Dùng transaction để đảm bảo atomicity.
 *
 * @param {number} attemptId   - quiz_attempt.id
 * @param {number} attemptQuestionId - attempt_questions.id (câu hỏi đang trả lời)
 * @param {number} attemptOptionId  - attempt_options.id   (đáp án được chọn)
 */
export const upsertAnswer = async (attemptId, attemptQuestionId, attemptOptionId) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Chú thích (BE): Xoá đáp án cũ của câu hỏi này trong attempt
    // Tìm tất cả option_id thuộc câu hỏi đó rồi xoá trong attempt_answers
    const [options] = await conn.execute(
      `SELECT id FROM attempt_options WHERE attempt_question_id = ?`,
      [attemptQuestionId]
    );
    if (options.length > 0) {
      const optionIds = options.map(o => o.id);
      // Chú thích (BE): Dùng placeholders động để xoá tất cả đáp án cũ
      const placeholders = optionIds.map(() => '?').join(',');
      await conn.execute(
        `DELETE FROM attempt_answers WHERE attempt_option_id IN (${placeholders})`,
        optionIds
      );
    }

    // Chú thích (BE): Insert đáp án mới vào attempt_answers
export const deleteAttemptAnswers = async (conn, attemptQuestionId) => {
  // Chú thích (BE): Xoá đáp án cũ của câu hỏi này trong attempt
  // Tìm tất cả option_id thuộc câu hỏi đó rồi xoá trong attempt_answers
  const [options] = await conn.execute(
    `SELECT id FROM attempt_options WHERE attempt_question_id = ?`,
    [attemptQuestionId]
  );
  if (options.length > 0) {
    const optionIds = options.map(o => o.id);
    // Chú thích (BE): Dùng placeholders động để xoá tất cả đáp án cũ
    const placeholders = optionIds.map(() => '?').join(',');
    await conn.execute(
      `DELETE FROM attempt_answers WHERE attempt_option_id IN (${placeholders})`,
      optionIds
    );
  }
};

export const insertAttemptAnswer = async (conn, attemptOptionId) => {
  // Chú thích (BE): Insert đáp án mới vào attempt_answers
  await conn.execute(
    `INSERT INTO attempt_answers (attempt_option_id) VALUES (?)`,
    [attemptOptionId]
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

export const countTotalAttempts = async (quizId) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_id = ?`,
    [quizId]
  );
  return rows[0].count;
};

export const createQuizAttempt = async (conn, userId, quizId, quizTitle) => {
  const [result] = await conn.execute(
    `INSERT INTO quiz_attempts (user_id, quiz_id, quiz_title, started_at) VALUES (?, ?, ?, NOW())`,
    [userId, quizId, quizTitle]
  );
  return result.insertId;
};

export const getQuestionsAndAnswersByQuizId = async (conn, quizId) => {
  const [rows] = await conn.execute(
    `SELECT q.id as question_id, q.content as question_content, q.type as question_type,
            a.id as answer_id, a.content as answer_content, a.is_correct as answer_is_correct
     FROM questions q
     LEFT JOIN answers a ON q.id = a.question_id
     WHERE q.quiz_id = ?`,
    [quizId]
  );
  return rows;
};

export const bulkInsertAttemptQuestions = async (conn, questionsData) => {
  if (questionsData.length === 0) return null;
  const [result] = await conn.query(
    `INSERT INTO attempt_questions (quiz_attempt_id, content, type) VALUES ?`,
    [questionsData]
  );
  return result;
};

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
    `SELECT id, content, type FROM attempt_questions WHERE quiz_attempt_id = ?`,
    [attemptId]
  );

  const questionsData = [];

  for (const q of questions) {
    const [options] = await pool.execute(
      `SELECT id, content FROM attempt_options WHERE attempt_question_id = ?`,
      [q.id]
    );

    // Chú thích (BE): Truy vấn xem câu hỏi này đã có đáp án được chọn chưa (auto-saved)
    const [answers] = await pool.execute(
      `SELECT attempt_option_id FROM attempt_answers 
       WHERE attempt_option_id IN (SELECT id FROM attempt_options WHERE attempt_question_id = ?)`,
      [q.id]
    );

    const optionsData = options.map(o => ({
      id: o.id,
      text: o.content
    }));

    const selectedOptionId = answers.length > 0 ? answers[0].attempt_option_id : null;

    questionsData.push({
      id: q.id,
      text: q.content,
      type: q.type,
      options: optionsData,
      selectedOptionId: selectedOptionId
    });
  }

  return {
    attemptId,
    questions: questionsData
  };
};

/**
 * Lấy số lượng câu hỏi và số câu trả lời đúng của bài làm
 */
export const getAttemptScoreData = async (attemptId) => {
  const [totalRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM attempt_questions WHERE quiz_attempt_id = ?`,
    [attemptId]
  );
  
  const [correctRows] = await pool.execute(
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
 * Đánh dấu nộp bài và cập nhật điểm số
 */
export const markAttemptFinished = async (attemptId, score) => {
  await pool.execute(
    `UPDATE quiz_attempts SET finished_at = NOW(), score = ? WHERE id = ?`,
    [score, attemptId]
  );
};

/**
 * Tăng số lần vi phạm chuyển tab
 */
export const incrementTabViolation = async (attemptId) => {
  await pool.execute(
    `UPDATE quiz_attempts SET tab_violations = tab_violations + 1 WHERE id = ?`,
    [attemptId]
  );
};
