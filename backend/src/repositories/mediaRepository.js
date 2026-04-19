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

/**
 * Lưu thông tin người sở hữu media (người upload).
 */
export const saveMediaAsset = async (filePath, userId) => {
  const sql = `
    INSERT INTO media_assets (file_path, user_id) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);
  `;
  await pool.execute(sql, [filePath, userId]);
};

/**
 * Lấy ID người sở hữu media dựa trên đường dẫn tệp.
 */
export const getMediaAssetOwner = async (filePath) => {
  const sql = 'SELECT user_id FROM media_assets WHERE file_path = ?';
  const [rows] = await pool.execute(sql, [filePath]);
  return rows[0]?.user_id || null;
};

