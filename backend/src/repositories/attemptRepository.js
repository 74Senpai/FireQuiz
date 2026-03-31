import pool from '../db/db.js';

const buildPlaceholders = (values) => values.map(() => '?').join(', ');

export const getFinishedAttemptsByQuizId = async (quizId) => {
  const sql = `
    SELECT
      qa.id,
      qa.user_id,
      qa.quiz_id,
      qa.score,
      qa.started_at,
      qa.finished_at,
      TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at) AS duration_seconds
    FROM quiz_attempts qa
    WHERE qa.quiz_id = ?
      AND qa.finished_at IS NOT NULL;
  `;

  const [rows] = await pool.execute(sql, [quizId]);
  return rows;
};

export const getLatestAttemptsByQuizId = async (quizId) => {
  const sql = `
    WITH ranked_attempts AS (
      SELECT
        qa.id,
        qa.user_id,
        qa.quiz_id,
        qa.score,
        qa.started_at,
        qa.finished_at,
        CASE
          WHEN qa.finished_at IS NULL THEN NULL
          ELSE TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at)
        END AS duration_seconds,
        ROW_NUMBER() OVER (
          PARTITION BY qa.user_id
          ORDER BY qa.created_at DESC, qa.id DESC
        ) AS rn
      FROM quiz_attempts qa
      WHERE qa.quiz_id = ?
    )
    SELECT *
    FROM ranked_attempts
    WHERE rn = 1;
  `;

  const [rows] = await pool.execute(sql, [quizId]);
  return rows;
};

export const getUserAttemptCountsByQuizId = async (quizId) => {
  const sql = `
    SELECT
      qa.user_id,
      COUNT(*) AS total_attempts
    FROM quiz_attempts qa
    WHERE qa.quiz_id = ?
    GROUP BY qa.user_id;
  `;

  const [rows] = await pool.execute(sql, [quizId]);
  return rows;
};

export const getAttemptQuestionsByAttemptIds = async (attemptIds) => {
  if (!attemptIds.length) {
    return [];
  }

  const placeholders = buildPlaceholders(attemptIds);
  const sql = `
    SELECT
      aq.id,
      aq.quiz_attempt_id,
      aq.content,
      aq.type
    FROM attempt_questions aq
    WHERE aq.quiz_attempt_id IN (${placeholders});
  `;

  const [rows] = await pool.execute(sql, attemptIds);
  return rows;
};

export const getAttemptOptionsByQuestionIds = async (questionIds) => {
  if (!questionIds.length) {
    return [];
  }

  const placeholders = buildPlaceholders(questionIds);
  const sql = `
    SELECT
      ao.id,
      ao.attempt_question_id,
      ao.is_correct
    FROM attempt_options ao
    WHERE ao.attempt_question_id IN (${placeholders});
  `;

  const [rows] = await pool.execute(sql, questionIds);
  return rows;
};

export const getAttemptAnswersByOptionIds = async (optionIds) => {
  if (!optionIds.length) {
    return [];
  }

  const placeholders = buildPlaceholders(optionIds);
  const sql = `
    SELECT
      aa.id,
      aa.attempt_option_id
    FROM attempt_answers aa
    WHERE aa.attempt_option_id IN (${placeholders});
  `;

  const [rows] = await pool.execute(sql, optionIds);
  return rows;
};
