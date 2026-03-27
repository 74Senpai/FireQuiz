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
      aa.attempt_option_id
    FROM attempt_answers aa
    WHERE aa.attempt_option_id IN (${placeholders});
  `;

  const [rows] = await pool.execute(sql, optionIds);
  return rows;
}
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
    await conn.execute(
      `INSERT INTO attempt_answers (attempt_option_id) VALUES (?)`,
      [attemptOptionId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Kiểm tra attempt có thuộc về user và chưa finished_at chưa.
 */
export const getAttemptById = async (attemptId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM quiz_attempts WHERE id = ?`,
    [attemptId]
  );
  return rows[0] || null;
};

export const countUserAttempts = async (quizId, userId) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?`,
    [userId, quizId]
  );
  return rows[0].count;
};

export const generateAttemptSnapshot = async (quizId, userId, quizTitle) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insert quiz_attempts
    const [attemptResult] = await conn.execute(
      `INSERT INTO quiz_attempts (user_id, quiz_id, quiz_title, started_at) VALUES (?, ?, ?, NOW())`,
      [userId, quizId, quizTitle]
    );
    const attemptId = attemptResult.insertId;

    // 2. Lấy questions từ db
    const [questions] = await conn.execute(
      `SELECT id, content, type FROM questions WHERE quiz_id = ?`,
      [quizId]
    );

    const questionsData = [];

    // 3. Với mỗi question, lấy answers và insert vào attempt_questions/options
    for (const q of questions) {
      const [aqResult] = await conn.execute(
        `INSERT INTO attempt_questions (quiz_attempt_id, content, type) VALUES (?, ?, ?)`,
        [attemptId, q.content, q.type]
      );
      const aqId = aqResult.insertId;

      const [answers] = await conn.execute(
        `SELECT id, content, is_correct FROM answers WHERE question_id = ?`,
        [q.id]
      );

      const optionsData = [];
      for (const a of answers) {
        const [aoResult] = await conn.execute(
          `INSERT INTO attempt_options (attempt_question_id, content, is_correct) VALUES (?, ?, ?)`,
          [aqId, a.content, a.is_correct]
        );
        // Chú thích (BE): Không trả về is_correct cho Client để tránh lộ đáp án
        optionsData.push({
          id: aoResult.insertId,
          text: a.content,
        });
      }

      questionsData.push({
        id: aqId,
        text: q.content,
        type: q.type,
        options: optionsData
      });
    }

    await conn.commit();
    return {
      attemptId,
      questions: questionsData
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
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
