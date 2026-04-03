import pool from '../db/db.js';

export const createAnswer = async ({ content, isCorrect, questionId }) => {
  const [result] = await pool.query(
    'INSERT INTO answers (content, is_correct, question_id) VALUES (?, ?, ?)',
    [content, isCorrect, questionId]
  );
  return result.insertId;
};

// Hàm lấy danh sách đáp án theo câu hỏi
export const getAnswersByQuestionId = async (questionId) => {
  const [rows] = await pool.query(
    'SELECT * FROM answers WHERE question_id = ?',
    [questionId]
  );
  return rows;
};

export const getAnswersByQuestionIds = async (questionIds) => {
  if (!questionIds.length) {
    return [];
  }

  const placeholders = questionIds.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT * FROM answers WHERE question_id IN (${placeholders}) ORDER BY question_id, id`,
    questionIds,
  );

  return rows;
};
