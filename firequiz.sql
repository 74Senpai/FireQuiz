-- Xoá database nếu tồn tại
DROP DATABASE IF EXISTS firequiz;

-- Tạo database
CREATE DATABASE firequiz;

USE firequiz;

-- =========================
-- TABLE: users
-- =========================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin','user') NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);

-- =========================
-- TABLE: quizzes
-- =========================
CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    creator_id INT NOT NULL,
    quiz_code CHAR(10) UNIQUE,
    description TEXT,
    status CHAR(10) NOT NULL DEFAULT 'DRAFT',
    grading_scale INT,
    time_limit_seconds INT,
    available_from DATETIME,
    available_until DATETIME,
    max_attempts INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_quiz_creator
        FOREIGN KEY (creator_id)
        REFERENCES users(id)
);

CREATE INDEX idx_quizzes_creator_id ON quizzes(creator_id);
CREATE INDEX idx_quizzes_quiz_code ON quizzes(quiz_code);

-- =========================
-- TABLE: quiz_attempts
-- =========================
CREATE TABLE quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    started_at DATETIME NOT NULL,
    finished_at DATETIME,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_attempt_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_attempt_quiz
        FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id)
);

CREATE INDEX idx_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_attempts_quiz_id ON quiz_attempts(quiz_id);

-- =========================
-- TABLE: questions
-- =========================
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(255) NOT NULL,
    type CHAR(10) NOT NULL,
    quiz_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_question_quiz
        FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id)
);

CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);

-- =========================
-- TABLE: answers
-- =========================
CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(255) NOT NULL,
    question_id INT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_answer_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
);

CREATE INDEX idx_answers_question_id ON answers(question_id);

-- =========================
-- TABLE: question_responses
-- =========================
CREATE TABLE question_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    text_answer TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_response_attempt
        FOREIGN KEY (quiz_attempt_id)
        REFERENCES quiz_attempts(id),

    CONSTRAINT fk_response_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
);

CREATE INDEX idx_responses_attempt_id ON question_responses(quiz_attempt_id);
CREATE INDEX idx_responses_question_id ON question_responses(question_id);

-- =========================
-- TABLE: response_answers
-- =========================
CREATE TABLE response_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_response_id INT NOT NULL,
    answer_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_response_answer_response
        FOREIGN KEY (question_response_id)
        REFERENCES question_responses(id),

    CONSTRAINT fk_response_answer_answer
        FOREIGN KEY (answer_id)
        REFERENCES answers(id)
);

CREATE INDEX idx_response_answers_response_id ON response_answers(question_response_id);
CREATE INDEX idx_response_answers_answer_id ON response_answers(answer_id);

CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(512) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_session_user
      FOREIGN KEY (user_id)
      REFERENCES users(id)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
