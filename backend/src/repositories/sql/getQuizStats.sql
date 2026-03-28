SELECT
  COUNT(*) AS total_attempts,
  SUM(CASE WHEN finished_at IS NOT NULL THEN 1 ELSE 0 END) AS submitted_count,
  SUM(CASE WHEN finished_at IS NULL THEN 1 ELSE 0 END) AS in_progress_count,
  ROUND(AVG(CASE WHEN finished_at IS NOT NULL THEN score END), 2) AS avg_score,
  MAX(CASE WHEN finished_at IS NOT NULL THEN score END) AS max_score,
  MIN(CASE WHEN finished_at IS NOT NULL THEN score END) AS min_score
FROM quiz_attempts
WHERE quiz_id = ?;
