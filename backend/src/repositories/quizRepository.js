import pool from '../db/db.js';

export const createQuiz = async (data) => {
  const {
    title,
    creatorId,
    description,
    status,
    gradingScale,
    timeLimitSeconds,
    availableFrom,
    availableUntil,
    maxAttempts
  } = data;

  const sql = `
    INSERT INTO quizzes
    (title, creator_id, description, status, grading_scale, time_limit_seconds, available_from, available_until, max_attempts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute(sql, [
    title,
    creatorId,
    description ?? null,
    status ?? 'DRAFT',
    gradingScale ?? null,
    timeLimitSeconds ?? null,
    availableFrom ?? null,
    availableUntil ?? null,
    maxAttempts ?? null
  ]);

  return result.insertId;
};

export const getQuizById = async (id) => {
  const sql = "SELECT * FROM quizzes WHERE id = ? AND status != 'DELETED';";
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
    SET grading_scale = COALESCE(?, grading_scale),
        time_limit_seconds = COALESCE(?, time_limit_seconds),
        available_from = COALESCE(?, available_from),
        available_until = COALESCE(?, available_until),
        max_attempts = COALESCE(?, max_attempts)
    WHERE id = ?
  `;

  await pool.execute(sql, [
    gradingScale ?? null,
    timeLimitSeconds ?? null,
    availableFrom ?? null,
    availableUntil ?? null,
    maxAttempts ?? null,
    id
  ]);
};

export const updateQuizInfo = async (id, data) => {
  const { title, description } = data;

  const sql = `
    UPDATE quizzes
    SET title = COALESCE(?, title), description = COALESCE(?, description)
    WHERE id = ?
  `;

  await pool.execute(sql, [title ?? null, description ?? null, id]);
};

export const getListQuizByUserId = async (id) => {
  const sql = "SELECT * FROM quizzes WHERE creator_id = ? AND status != 'DELETED';";

  const [row] = await pool.execute(sql, [id]);
  return row;
};

export const softDelete = async (id) => {
  const sql = "UPDATE quizzes SET status = 'DELETED' WHERE id = ? AND status != 'DELETED';";
  await pool.execute(sql, [id]);
};

export const hardDelete = async (id) => {
  const sql = "DELETE FROM quizzes WHERE id = ? AND status != 'DELETED';";
  await pool.execute(sql, [id]);
};
