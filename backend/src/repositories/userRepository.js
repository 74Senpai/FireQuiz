import pool from '../db/db.js';

export const findById = async (id) => {
  const sql = "SELECT * FROM users where id = ? AND is_active = 1;";

  const [row] = await pool.execute(sql, [id]);
  return row[0] || null;
}

export const findByEmail = async (email) => {
  const sql = "SELECT * FROM users WHERE email = ? AND is_active = 1;";

  const [row] = await pool.execute(sql, [email]);
  return row[0] || null;
}

export const findActiveUsersByIds = async (ids) => {
  if (!ids.length) {
    return [];
  }

  const placeholders = ids.map(() => '?').join(', ');
  const sql = `
    SELECT *
    FROM users
    WHERE is_active = 1
      AND id IN (${placeholders});
  `;

  const [rows] = await pool.execute(sql, ids);
  return rows;
}

export const create = async (data) => {
  const {username, hashedPassword, fullName, email} = data;
  const sql = "INSERT INTO users(password_hash, full_name, email) VALUES (?, ?, ?);";

  await pool.execute(sql, [hashedPassword, fullName, email]);
}

export const updatePasswordById = async (userId, hashedPassword) => {
  const sql = `
    UPDATE users
    SET password_hash = ?
    WHERE id = ? AND is_active = 1;
  `;

  const [result] = await pool.execute(sql, [hashedPassword, userId]);

  return result.affectedRows > 0;
};

export const updatePasswordByEmail = async (email, hashedPassword) => {
  const sql = `
    UPDATE users
    SET password_hash = ?
    WHERE email = ? AND is_active = 1;
  `;

  const [result] = await pool.execute(sql, [hashedPassword, email]);

  return result.affectedRows > 0;
};
