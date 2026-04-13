import pool from '../db/db.js';

/**
 * Đếm số lượng bản ghi đang sử dụng mediaUrl trên toàn hệ thống.
 * Bao gồm: questions, quizzes, users, và snapshot trong attempt_questions.
 */
export const countMediaUsage = async (url) => {
  if (!url) return 0;

  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM questions WHERE media_url = ?) +
      (SELECT COUNT(*) FROM attempt_questions WHERE media_url = ?) +
      (SELECT COUNT(*) FROM quizzes WHERE thumbnail_url = ?) +
      (SELECT COUNT(*) FROM users WHERE avatar_url = ?)
    AS usage_count;
  `;

  const [rows] = await pool.execute(sql, [url, url, url, url]);
  return rows[0]?.usage_count || 0;
};
