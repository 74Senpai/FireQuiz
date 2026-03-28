import pool from '../db/db.js';

const buildInClause = (values = []) => {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  return values.map(() => '?').join(', ');
};

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

export const hasStableAttemptReferenceColumns = async () => {
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

export const getAutoGradableQuestionsByQuizId = async (quizId) => {
  const sql = `
    SELECT id, content, type
    FROM questions
    WHERE quiz_id = ?
      AND type IN ('ANANSWER', 'MULTI_ANSWERS')
    ORDER BY id ASC;
  `;

  const [rows] = await pool.execute(sql, [quizId]);
  return rows;
};

export const getAnswersByQuestionIds = async (questionIds = []) => {
  const inClause = buildInClause(questionIds);
  if (!inClause) {
    return [];
  }

  const sql = `
    SELECT id, question_id, content, is_correct
    FROM answers
    WHERE question_id IN (${inClause})
    ORDER BY question_id ASC, id ASC;
  `;

  const [rows] = await pool.execute(sql, questionIds);
  return rows;
};

export const getSubmittedAttemptQuestionsByQuizId = async (quizId) => {
  const sql = `
    SELECT
      aq.id,
      aq.quiz_attempt_id,
      aq.original_question_id,
      aq.type
    FROM attempt_questions aq
    INNER JOIN quiz_attempts qa ON qa.id = aq.quiz_attempt_id
    WHERE qa.quiz_id = ?
      AND qa.finished_at IS NOT NULL
    ORDER BY aq.quiz_attempt_id ASC, aq.id ASC;
  `;

  const [rows] = await pool.execute(sql, [quizId]);
  return rows;
};

export const getAttemptOptionsByAttemptQuestionIds = async (attemptQuestionIds = []) => {
  const inClause = buildInClause(attemptQuestionIds);
  if (!inClause) {
    return [];
  }

  const sql = `
    SELECT id, attempt_question_id, original_answer_id
    FROM attempt_options
    WHERE attempt_question_id IN (${inClause})
    ORDER BY attempt_question_id ASC, id ASC;
  `;

  const [rows] = await pool.execute(sql, attemptQuestionIds);
  return rows;
};

export const getAttemptAnswerCountsByAttemptOptionIds = async (attemptOptionIds = []) => {
  const inClause = buildInClause(attemptOptionIds);
  if (!inClause) {
    return [];
  }

  const sql = `
    SELECT attempt_option_id, COUNT(*) AS selection_count
    FROM attempt_answers
    WHERE attempt_option_id IN (${inClause})
    GROUP BY attempt_option_id;
  `;

  const [rows] = await pool.execute(sql, attemptOptionIds);
  return rows;
};
