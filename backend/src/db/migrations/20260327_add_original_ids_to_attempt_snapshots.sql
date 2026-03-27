-- Add stable references from attempt snapshots back to source questions/answers.
-- Run this script before enabling the new direct-join analytics query in production.

ALTER TABLE attempt_questions
  ADD COLUMN original_question_id INT NULL AFTER quiz_attempt_id,
  ADD INDEX idx_attempt_questions_original_question (original_question_id),
  ADD CONSTRAINT fk_attempt_questions_original_question
    FOREIGN KEY (original_question_id) REFERENCES questions (id)
    ON DELETE SET NULL;

ALTER TABLE attempt_options
  ADD COLUMN original_answer_id INT NULL AFTER attempt_question_id,
  ADD INDEX idx_attempt_options_original_answer (original_answer_id),
  ADD CONSTRAINT fk_attempt_options_original_answer
    FOREIGN KEY (original_answer_id) REFERENCES answers (id)
    ON DELETE SET NULL;

-- Best-effort backfill for legacy snapshot rows.
-- This still uses historical ordering one time to populate the new columns.
-- After this migration, new analytics should rely on original_*_id instead of ROW_NUMBER().

UPDATE attempt_questions aq
INNER JOIN (
  SELECT
    legacy_attempts.attempt_question_id,
    current_questions.question_id
  FROM (
    SELECT
      aq_inner.id AS attempt_question_id,
      qa.quiz_id,
      aq_inner.type AS question_type,
      ROW_NUMBER() OVER (
        PARTITION BY aq_inner.quiz_attempt_id
        ORDER BY aq_inner.id
      ) AS question_order
    FROM attempt_questions aq_inner
    INNER JOIN quiz_attempts qa ON qa.id = aq_inner.quiz_attempt_id
  ) legacy_attempts
  INNER JOIN (
    SELECT
      q.id AS question_id,
      q.quiz_id,
      q.type AS question_type,
      ROW_NUMBER() OVER (
        PARTITION BY q.quiz_id
        ORDER BY q.id
      ) AS question_order
    FROM questions q
    WHERE q.type IN ('ANANSWER', 'MULTI_ANSWERS')
  ) current_questions
    ON current_questions.quiz_id = legacy_attempts.quiz_id
   AND current_questions.question_type = legacy_attempts.question_type
   AND current_questions.question_order = legacy_attempts.question_order
) mapped_questions
  ON mapped_questions.attempt_question_id = aq.id
SET aq.original_question_id = mapped_questions.question_id
WHERE aq.original_question_id IS NULL;

UPDATE attempt_options ao
INNER JOIN (
  SELECT
    legacy_options.attempt_option_id,
    current_answers.answer_id
  FROM (
    SELECT
      ao_inner.id AS attempt_option_id,
      aq.original_question_id AS question_id,
      ROW_NUMBER() OVER (
        PARTITION BY ao_inner.attempt_question_id
        ORDER BY ao_inner.id
      ) AS option_order
    FROM attempt_options ao_inner
    INNER JOIN attempt_questions aq ON aq.id = ao_inner.attempt_question_id
    WHERE aq.original_question_id IS NOT NULL
  ) legacy_options
  INNER JOIN (
    SELECT
      a.id AS answer_id,
      a.question_id,
      ROW_NUMBER() OVER (
        PARTITION BY a.question_id
        ORDER BY a.id
      ) AS option_order
    FROM answers a
  ) current_answers
    ON current_answers.question_id = legacy_options.question_id
   AND current_answers.option_order = legacy_options.option_order
) mapped_answers
  ON mapped_answers.attempt_option_id = ao.id
SET ao.original_answer_id = mapped_answers.answer_id
WHERE ao.original_answer_id IS NULL;
