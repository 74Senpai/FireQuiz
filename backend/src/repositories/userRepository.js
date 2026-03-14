import pool from '../db/db.js';

export const findById = async (id) => {
  const sql = "SELECT * FROM users where id = ?;";

  const [row] = await pool.execute(sql, [id]);
  return row[0] || null;
}

export const findByUsername = async (username) => {
  const sql = "SELECT * FROM users WHERE username = ?";

  const [row] = await pool.execute(sql, [username]);
  return row[0] || null;
}

export const findByEmail = async (email) => {
  const sql = "SELECT * FROM users WHERE email = ?"

  const [row] = await pool.execute(sql, [email]);
  return row[0] || null;
}

export const create = async (data) => {
  const {username, hashedPassword, fullName, email} = data;
  const sql = "INSERT INTO users(username, password_hash, full_name, email) VALUES (?, ?, ?, ?);";

  await pool.execute(sql, [username, hashedPassword, fullName, email]);
}
