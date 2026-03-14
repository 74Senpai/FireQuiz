import pool from '../db/db.js';

export const createQuiz = async (data) => {
  const {
    title,
    creatorId,
    description,
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts
  } = data;

  const sql = `
    INSERT INTO quizzes
    (title, creator_id, description, grading_scale, time_limit_seconds, available_from, available_until, max_attempts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute(sql, [
    title,
    creatorId,
    description,
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts
  ]);

  return result.insertId;
};

export const getQuizById = async (id) => {
  const sql = "SELECT * FROM quizzes WHERE id = ?;";
  const [quiz] = await pool.execute(sql, [id]);
  return quiz[0] || null;
}

export const setStatus = async (id, status) => {
  const sql = "UPDATE quizzes SET status = ? WHERE id = ?;";
  await pool.execute(sql, [status, id]);
}

export const updateQuizSettings = async (id, data) => {
  const {
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts
  } = data;

  const sql = `
    UPDATE quizzes
    SET grading_scale = ?,
        time_limit_seconds = ?,
        available_from = ?,
        available_until = ?,
        max_attempts = ?
    WHERE id = ?
  `;

  await pool.execute(sql, [
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts,
    id
  ]);
};

export const updateQuizInfo = async (id, data) => {
  const { title, description } = data;

  const sql = `
    UPDATE quizzes
    SET title = ?, description = ?
    WHERE id = ?
  `;

  await pool.execute(sql, [title, description, id]);
};
