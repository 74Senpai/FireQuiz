import pool from '../db/db.js';

export const create = async (data) => {
  const { userId, token} = data;
  const sql = "INSERT INTO sessions(user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 14 DAY));"

  await pool.execute(sql, [userId, token]);
}

export const deleteSessionByToken = async(token) => {
  const sql = "DELETE FROM sessions WHERE token = ?;";

  await pool.execute(sql, [token]);
}

export const findSessionByToken = async (token) => {
  const sql = "SELECT * FROM sessions WHERE token = ?;";

  const [row] = await pool.execute(sql, [token]);
  return row[0] || null;
}
