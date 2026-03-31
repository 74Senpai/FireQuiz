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
