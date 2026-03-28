SELECT
  qa.id AS attempt_id,
  qa.quiz_id,
  qa.quiz_title,
  qa.score,
  qa.started_at,
  qa.finished_at,
  TIMESTAMPDIFF(SECOND, qa.started_at, qa.finished_at) AS duration_seconds,
  CASE
    WHEN qa.finished_at IS NOT NULL THEN 'SUBMITTED'
    ELSE 'IN_PROGRESS'
  END AS submit_status,
  u.id AS user_id,
  u.full_name,
  u.email
FROM quiz_attempts qa
INNER JOIN users u ON qa.user_id = u.id
__WHERE_CLAUSE__
ORDER BY qa.started_at DESC
__PAGINATION_CLAUSE__;
