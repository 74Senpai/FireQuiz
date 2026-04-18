import pool from '../db/db.js';

export const create = async ({ content, type, mediaUrl, difficulty, category, creatorId }, tx = pool) => {
  const [row] = await tx.execute(
    'INSERT INTO bank_questions (content, type, media_url, difficulty, category, creator_id) VALUES (?, ?, ?, ?, ?, ?)',
    [content, type, mediaUrl ?? null, difficulty ?? 'medium', category ?? null, creatorId]
  );
  return row.insertId;
};

export const createAnswer = async ({ content, isCorrect, bankQuestionId }, tx = pool) => {
  const [row] = await tx.execute(
    'INSERT INTO bank_answers (content, is_correct, bank_question_id) VALUES (?, ?, ?)',
    [content, isCorrect, bankQuestionId]
  );
  return row.insertId;
};

export const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM bank_questions WHERE id = ?', [id]);
  return rows[0] || null;
};

export const findByIds = async (ids) => {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const [rows] = await pool.execute(`SELECT * FROM bank_questions WHERE id IN (${placeholders})`, ids);
  return rows;
};

export const findAll = async ({ creatorId, category, difficulty, type, search }) => {
  let sql = 'SELECT * FROM bank_questions WHERE creator_id = ?';
  const params = [creatorId];

  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (difficulty) { sql += ' AND difficulty = ?'; params.push(difficulty); }
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (search) { sql += ' AND content LIKE ?'; params.push(`%${search}%`); }

  sql += ' ORDER BY created_at DESC';
  const [rows] = await pool.execute(sql, params);
  return rows;
};

export const findAnswersByQuestionIds = async (ids) => {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `SELECT * FROM bank_answers WHERE bank_question_id IN (${placeholders})`,
    ids
  );
  return rows;
};

export const update = async (id, { content, type, mediaUrl, difficulty, category }, tx = pool) => {
  await tx.execute(
    `UPDATE bank_questions SET
      content = COALESCE(?, content),
      type = COALESCE(?, type),
      media_url = COALESCE(?, media_url),
      difficulty = COALESCE(?, difficulty),
      category = COALESCE(?, category)
    WHERE id = ?`,
    [content ?? null, type ?? null, mediaUrl ?? null, difficulty ?? null, category ?? null, id]
  );
};

export const deleteAnswersByQuestionId = async (id, tx = pool) => {
  await tx.execute('DELETE FROM bank_answers WHERE bank_question_id = ?', [id]);
};

export const deleteById = async (id, tx = pool) => {
  await tx.execute('DELETE FROM bank_questions WHERE id = ?', [id]);
};
