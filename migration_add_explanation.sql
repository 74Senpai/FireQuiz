ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS explanation TEXT AFTER media_url;

ALTER TABLE attempt_questions
  ADD COLUMN IF NOT EXISTS explanation TEXT AFTER media_url;
