WITH quiz_attempt_totals AS (
  SELECT
    COUNT(*) AS total_attempts,
    SUM(CASE WHEN finished_at IS NOT NULL THEN 1 ELSE 0 END) AS submitted_attempts
  FROM quiz_attempts
  WHERE quiz_id = ?
),
question_catalog AS (
  SELECT
    q.id AS question_id,
    q.content AS question_content,
    q.type AS question_type
  FROM questions q
  WHERE q.quiz_id = ?
    AND q.type IN ('ANANSWER', 'MULTI_ANSWERS')
),
option_catalog AS (
  SELECT
    a.id AS option_id,
    a.question_id,
    a.content AS option_content,
    a.is_correct
  FROM answers a
  INNER JOIN question_catalog qc ON qc.question_id = a.question_id
),
mapped_attempt_questions AS (
  SELECT
    aq.id AS attempt_question_id,
    aq.quiz_attempt_id,
    aq.original_question_id AS question_id
  FROM attempt_questions aq
  INNER JOIN quiz_attempts qa
    ON qa.id = aq.quiz_attempt_id
  WHERE qa.quiz_id = ?
    AND qa.finished_at IS NOT NULL
    AND aq.original_question_id IS NOT NULL
),
option_attempt_flags AS (
  SELECT
    maq.question_id,
    maq.quiz_attempt_id,
    maq.attempt_question_id,
    oc.option_id,
    oc.option_content,
    oc.is_correct,
    COUNT(aa.id) AS selection_count
  FROM mapped_attempt_questions maq
  INNER JOIN option_catalog oc ON oc.question_id = maq.question_id
  LEFT JOIN attempt_options ao
    ON ao.attempt_question_id = maq.attempt_question_id
   AND ao.original_answer_id = oc.option_id
  LEFT JOIN attempt_answers aa ON aa.attempt_option_id = ao.id
  GROUP BY
    maq.question_id,
    maq.quiz_attempt_id,
    maq.attempt_question_id,
    oc.option_id,
    oc.option_content,
    oc.is_correct
),
attempt_question_summary AS (
  SELECT
    maq.question_id,
    maq.attempt_question_id,
    COUNT(DISTINCT maq.quiz_attempt_id) AS exposure_count,
    SUM(CASE WHEN COALESCE(oaf.selection_count, 0) > 0 THEN 1 ELSE 0 END) AS selected_option_count,
    SUM(CASE WHEN COALESCE(oaf.is_correct, 0) = 1 THEN 1 ELSE 0 END) AS correct_option_count,
    SUM(
      CASE
        WHEN COALESCE(oaf.is_correct, 0) = 1 AND COALESCE(oaf.selection_count, 0) > 0 THEN 1
        ELSE 0
      END
    ) AS selected_correct_option_count,
    SUM(
      CASE
        WHEN COALESCE(oaf.is_correct, 0) = 0 AND COALESCE(oaf.selection_count, 0) > 0 THEN 1
        ELSE 0
      END
    ) AS selected_incorrect_option_count
  FROM mapped_attempt_questions maq
  LEFT JOIN option_attempt_flags oaf
    ON oaf.question_id = maq.question_id
   AND oaf.attempt_question_id = maq.attempt_question_id
  GROUP BY maq.question_id, maq.attempt_question_id
),
question_summary AS (
  SELECT
    qc.question_id,
    qc.question_content,
    qc.question_type,
    qt.total_attempts,
    qt.submitted_attempts,
    COUNT(aqs.attempt_question_id) AS exposure_count,
    SUM(CASE WHEN COALESCE(aqs.selected_option_count, 0) > 0 THEN 1 ELSE 0 END) AS response_count,
    SUM(
      CASE
        WHEN qc.question_type = 'ANANSWER'
         AND COALESCE(aqs.selected_option_count, 0) = 1
         AND COALESCE(aqs.selected_correct_option_count, 0) = 1
         AND COALESCE(aqs.selected_incorrect_option_count, 0) = 0
        THEN 1
        WHEN qc.question_type = 'MULTI_ANSWERS'
         AND COALESCE(aqs.selected_option_count, 0) > 0
         AND COALESCE(aqs.selected_correct_option_count, 0) = COALESCE(aqs.correct_option_count, 0)
         AND COALESCE(aqs.selected_incorrect_option_count, 0) = 0
         AND COALESCE(aqs.selected_option_count, 0) = COALESCE(aqs.correct_option_count, 0)
        THEN 1
        ELSE 0
      END
    ) AS correct_count
  FROM question_catalog qc
  CROSS JOIN quiz_attempt_totals qt
  LEFT JOIN attempt_question_summary aqs ON aqs.question_id = qc.question_id
  GROUP BY
    qc.question_id,
    qc.question_content,
    qc.question_type,
    qt.total_attempts,
    qt.submitted_attempts
)
SELECT
  qs.question_id,
  qs.question_content,
  qs.question_type,
  qs.total_attempts,
  qs.submitted_attempts,
  qs.exposure_count,
  qs.response_count,
  qs.correct_count,
  GREATEST(qs.response_count - qs.correct_count, 0) AS incorrect_count,
  GREATEST(qs.exposure_count - qs.response_count, 0) AS skipped_count,
  oc.option_id,
  oc.option_content,
  oc.is_correct,
  COALESCE(SUM(oaf.selection_count), 0) AS selection_count
FROM question_summary qs
LEFT JOIN option_catalog oc ON oc.question_id = qs.question_id
LEFT JOIN option_attempt_flags oaf
  ON oaf.question_id = qs.question_id
 AND oaf.option_id = oc.option_id
GROUP BY
  qs.question_id,
  qs.question_content,
  qs.question_type,
  qs.total_attempts,
  qs.submitted_attempts,
  qs.exposure_count,
  qs.response_count,
  qs.correct_count,
  oc.option_id,
  oc.option_content,
  oc.is_correct
ORDER BY qs.question_id, oc.option_id;
