import pool from '../db/db.js';
import logger from '../utils/logger.js';

export const create = async (data, tx = pool) => {
  const { content, type, quizId, mediaUrl, explanation } = data;
 
  logger.info(`questionRepository.js - Creating question - content: ${content}, type: ${type}, quizId: ${quizId}`);
  const sql = "INSERT INTO questions(content, type, media_url, explanation, quiz_id) VALUES (?, ?, ?, ?, ?);";
  const [row] = await tx.execute(sql, [content, type, mediaUrl ?? null, explanation ?? null, quizId]);
  return row.insertId;
};

export const findQuestionById = async (id) => {
  const sql = "SELECT * FROM questions WHERE id = ?;";
  const [row] = await pool.execute(sql, [id]);
  return row[0] || null;
};

export const changeType = async (id, type, tx = pool) => {
  const sql = "UPDATE questions SET type = COALESCE(?, type) WHERE id = ?;";

  await tx.execute(sql, [type ?? null, id]);
};

export const changeContent = async (id, content, tx = pool) => {
  const sql = "UPDATE questions SET content = COALESCE(?, content) WHERE id = ?;";

  await tx.execute(sql, [content ?? null, id]);
};

export const changeMediaUrl = async (id, mediaUrl, tx = pool) => {
  const sql = "UPDATE questions SET media_url = ? WHERE id = ?;";
  await tx.execute(sql, [mediaUrl ?? null, id]);
};

export const getListQuestionByQuizId = async (id) => {
  const sql = "SELECT * FROM questions WHERE quiz_id = ?;";

  const [row] = await pool.execute(sql, [id]);
  return row;
};

export const changeExplanation = async (id, explanation, tx = pool) => {
  const sql = "UPDATE questions SET explanation = ? WHERE id = ?;";
  await tx.execute(sql, [explanation ?? null, id]);
};

export const deleteQuestionById = async (id, tx = pool) => {
  const sql = "DELETE FROM questions WHERE id = ?;";

  await tx.execute(sql, [id]);
};
