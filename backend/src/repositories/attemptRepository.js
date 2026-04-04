import pool from '../db/db.js';

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
