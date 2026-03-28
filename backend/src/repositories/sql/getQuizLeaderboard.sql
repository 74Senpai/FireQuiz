WITH ranked_attempts AS (
  SELECT
    qa.id AS attempt_id,
    qa.quiz_id,
    qa.quiz_title,
    qa.score,
    qa.started_at,
    qa.finished_at,
    TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at) AS duration_seconds,
    u.id AS user_id,
    u.full_name,
    u.email,
    ROW_NUMBER() OVER (
      PARTITION BY qa.user_id
      ORDER BY
        qa.score DESC,
        TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at) ASC,
        qa.finished_at ASC,
        qa.id ASC
    ) AS best_attempt_rank
  FROM quiz_attempts qa
  INNER JOIN users u ON qa.user_id = u.id
  WHERE
    qa.quiz_id = ?
    AND qa.finished_at IS NOT NULL
    AND qa.score IS NOT NULL
),
best_attempts AS (
  SELECT *
  FROM ranked_attempts
  WHERE best_attempt_rank = 1
),
leaderboard AS (
  SELECT
    attempt_id,
    quiz_id,
    quiz_title,
    score,
    started_at,
    finished_at,
    duration_seconds,
    user_id,
    full_name,
    email,
    ROW_NUMBER() OVER (
      ORDER BY
        score DESC,
        duration_seconds ASC,
        finished_at ASC,
        attempt_id ASC
    ) AS rank_position,
    COUNT(*) OVER () AS total_participants
  FROM best_attempts
)
SELECT
  attempt_id,
  quiz_id,
  quiz_title,
  score,
  started_at,
  finished_at,
  duration_seconds,
  user_id,
  full_name,
  email,
  rank_position,
  total_participants
FROM leaderboard
ORDER BY rank_position
LIMIT ?;
