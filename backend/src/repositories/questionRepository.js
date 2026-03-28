import { readFileSync } from 'node:fs';

import pool from '../db/db.js';

const readSqlFile = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8').trim();

const LEGACY_QUESTION_ANALYTICS_SQL = readSqlFile(
  './sql/getLegacyQuestionAnalytics.sql'
);
const STABLE_QUESTION_ANALYTICS_SQL = readSqlFile(
  './sql/getStableQuestionAnalytics.sql'
);

export const create = async (data) => {
  const { content, type, quizId } = data;

  console.log(`info: in questionRepository.js:6 content: ${content}, type: ${type}, quizId: ${quizId}`);
  const sql = 'INSERT INTO questions(content, type, quiz_id) VALUES (?, ?, ?);';
  const [row] = await pool.execute(sql, [content, type, quizId]);
  return row.insertId;
};

export const findQuestionById = async (id) => {
  const sql = 'SELECT * FROM questions WHERE id = ?;';
  const [row] = await pool.execute(sql, [id]);
  return row[0] || null;
};

export const changeType = async (id, type) => {
  const sql = 'UPDATE questions SET type = COALESCE(?, type) WHERE id = ?;';

  await pool.execute(sql, [type ?? null, id]);
};

export const changeContent = async (id, content) => {
  const sql = 'UPDATE questions SET content = COALESCE(?, content) WHERE id = ?;';

  await pool.execute(sql, [content ?? null, id]);
};

export const getListQuestionByQuizId = async (id) => {
  const sql = 'SELECT * FROM questions WHERE quiz_id = ?;';

  const [row] = await pool.execute(sql, [id]);
  return row;
};

export const deleteQuestionById = async (id) => {
  const sql = 'DELETE FROM questions WHERE id = ?;';

  await pool.execute(sql, [id]);
};

const hasStableAttemptReferenceColumns = async () => {
  const sql = `
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND (
        (table_name = 'attempt_questions' AND column_name = 'original_question_id')
        OR (table_name = 'attempt_options' AND column_name = 'original_answer_id')
      );
  `;

  try {
    const [rows] = await pool.execute(sql);
    return rows.length === 2;
  } catch (error) {
    return false;
  }
};

export const getQuestionAnalytics = async (quizId) => {
  const useStableMapping = await hasStableAttemptReferenceColumns();
  const sql = useStableMapping
    ? STABLE_QUESTION_ANALYTICS_SQL
    : LEGACY_QUESTION_ANALYTICS_SQL;

  const [rows] = await pool.execute(sql, [quizId, quizId, quizId]);
  return rows;
};
