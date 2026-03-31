import pool from '../db/db.js';

export const getLeaderboardByQuizId = async (quizId) => {
  const sql = `
    WITH ranked_attempts AS (
      SELECT
        qa.id,
        qa.quiz_id,
        qa.user_id,
        qa.score,
        qa.started_at,
        qa.finished_at,
        TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at) AS duration_seconds,
        ROW_NUMBER() OVER (
          PARTITION BY qa.user_id
          ORDER BY
            qa.score DESC,
            TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at) ASC,
            qa.finished_at ASC,
            qa.id ASC
        ) AS rn
      FROM quiz_attempts qa
      WHERE qa.quiz_id = ?
        AND qa.score IS NOT NULL
        AND qa.finished_at IS NOT NULL
    )
    SELECT
      ra.user_id,
      u.full_name,
      u.email,
      ra.score,
      ra.started_at,
      ra.finished_at,
      ra.duration_seconds
    FROM ranked_attempts ra
    INNER JOIN users u ON u.id = ra.user_id
    WHERE ra.rn = 1
      AND u.is_active = 1
    ORDER BY
      ra.score DESC,
      ra.duration_seconds ASC,
      ra.finished_at ASC,
      ra.user_id ASC
    LIMIT 10;
  `;

  const [rows] = await pool.execute(sql, [quizId]);
  return rows;
};

export const getQuestionAnalyticsByQuizId = async (quizId) => {
  const sql = `
    WITH finished_attempts AS (
      SELECT qa.id
      FROM quiz_attempts qa
      WHERE qa.quiz_id = ?
        AND qa.finished_at IS NOT NULL
    ),
    attempt_question_eval AS (
      SELECT
        aq.id AS attempt_question_id,
        aq.content,
        COUNT(DISTINCT CASE WHEN ao.is_correct = 1 THEN ao.id END) AS total_correct_options,
        COUNT(DISTINCT CASE WHEN aa.id IS NOT NULL AND ao.is_correct = 1 THEN ao.id END) AS selected_correct_options,
        COUNT(DISTINCT CASE WHEN aa.id IS NOT NULL AND ao.is_correct = 0 THEN ao.id END) AS selected_incorrect_options
      FROM attempt_questions aq
      INNER JOIN finished_attempts fa ON fa.id = aq.quiz_attempt_id
      LEFT JOIN attempt_options ao ON ao.attempt_question_id = aq.id
      LEFT JOIN attempt_answers aa ON aa.attempt_option_id = ao.id
      GROUP BY aq.id, aq.content
    ),
    attempt_question_stats AS (
      SELECT
        aqe.content,
        COUNT(*) AS total_responses,
        SUM(
          CASE
            WHEN aqe.total_correct_options > 0
              AND aqe.selected_incorrect_options = 0
              AND aqe.selected_correct_options = aqe.total_correct_options
            THEN 1
            ELSE 0
          END
        ) AS correct_responses
      FROM attempt_question_eval aqe
      GROUP BY aqe.content
    ),
    quiz_attempt_summary AS (
      SELECT COUNT(*) AS total_attempts
      FROM finished_attempts
    )
    SELECT
      q.id,
      q.content,
      q.type,
      qas.total_attempts,
      COALESCE(aqs.total_responses, 0) AS total_responses,
      COALESCE(aqs.correct_responses, 0) AS correct_responses,
      GREATEST(COALESCE(aqs.total_responses, 0) - COALESCE(aqs.correct_responses, 0), 0) AS incorrect_responses,
      CASE
        WHEN qas.total_attempts = 0 THEN 0
        ELSE ROUND(COALESCE(aqs.correct_responses, 0) * 100.0 / qas.total_attempts, 2)
      END AS correct_rate,
      CASE
        WHEN qas.total_attempts = 0 THEN 0
        ELSE ROUND(
          GREATEST(COALESCE(aqs.total_responses, 0) - COALESCE(aqs.correct_responses, 0), 0) * 100.0 / qas.total_attempts,
          2
        )
      END AS incorrect_rate,
      CASE
        WHEN qas.total_attempts = 0 THEN 0
        ELSE ROUND(COALESCE(aqs.total_responses, 0) * 100.0 / qas.total_attempts, 2)
      END AS response_rate
    FROM questions q
    CROSS JOIN quiz_attempt_summary qas
    LEFT JOIN attempt_question_stats aqs ON aqs.content = q.content
    WHERE q.quiz_id = ?
    ORDER BY q.id;
  `;

  const [rows] = await pool.execute(sql, [quizId, quizId]);
  return rows;
};
