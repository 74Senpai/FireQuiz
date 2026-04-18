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
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255),
    bio TEXT,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users (role);

-- =========================
-- TABLE: quizzes
-- =========================
CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    creator_id INT NOT NULL,
    quiz_code CHAR(10) UNIQUE,
    description TEXT,
    thumbnail_url VARCHAR(255),
    status CHAR(10) NOT NULL DEFAULT 'DRAFT',
    grading_scale INT,
    time_limit_seconds INT,
    available_from DATETIME,
    available_until DATETIME,
    max_attempts INT,
    max_tab_violations INT DEFAULT 2,
    max_attempts_per_user INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_creator FOREIGN KEY (creator_id) REFERENCES users (id)
);

CREATE INDEX idx_quizzes_creator_id ON quizzes (creator_id);
CREATE INDEX idx_quizzes_creator_status ON quizzes (creator_id, status);
CREATE INDEX idx_quizzes_public_window ON quizzes (status, available_from, available_until);
CREATE INDEX idx_quizzes_quiz_code ON quizzes (quiz_code);

-- =========================
-- TABLE: quiz_attempts
-- =========================
CREATE TABLE quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    quiz_title VARCHAR(255) NOT NULL,
    score DECIMAL(5, 2),
    tab_violations INT NOT NULL DEFAULT 0,   -- [FIX] Thêm cột ghi nhận vi phạm chuyển tab
    started_at DATETIME NOT NULL,
    finished_at DATETIME,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_attempt_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
);

CREATE INDEX idx_attempts_user_id ON quiz_attempts (user_id);
CREATE INDEX idx_attempts_quiz_id ON quiz_attempts (quiz_id);
CREATE INDEX idx_attempts_user_started ON quiz_attempts (user_id, started_at);

-- =========================
-- TABLE: questions
-- =========================
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(255) NOT NULL,
    type CHAR(15) NOT NULL,
    media_url VARCHAR(255),
    explanation TEXT,                         -- [FIX] Thêm cột giải thích đáp án
    quiz_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_question_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
);

CREATE INDEX idx_questions_quiz_id ON questions (quiz_id);

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
    CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES questions (id)
);

CREATE INDEX idx_answers_question_id ON answers (question_id);

-- =========================
-- TABLE: attempt_questions
-- =========================
CREATE TABLE attempt_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_attempt_id INT NOT NULL,
    content VARCHAR(255) NOT NULL,
    media_url VARCHAR(255),
    type VARCHAR(20) NOT NULL,               -- [FIX] VARCHAR(10) → VARCHAR(20) để chứa 'SINGLE_CHOICE', 'MULTIPLE_CHOICE'
    explanation TEXT,                         -- [FIX] Thêm cột giải thích (snapshot từ questions.explanation)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attempt_questions_quiz_attempts FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts (id)
);

CREATE INDEX idx_attempt_questions_attempt ON attempt_questions (quiz_attempt_id);

-- =========================
-- TABLE: attempt_options
-- =========================
CREATE TABLE attempt_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_question_id INT NOT NULL,
    content VARCHAR(255) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attempt_options_attempt_questions FOREIGN KEY (attempt_question_id) REFERENCES attempt_questions (id)
);

CREATE INDEX idx_attempt_options_question ON attempt_options (attempt_question_id);

-- =========================
-- TABLE: attempt_answers
-- =========================
CREATE TABLE attempt_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_option_id INT NOT NULL,
    text_answer TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attempt_answers_attempt_option_id FOREIGN KEY (attempt_option_id) REFERENCES attempt_options (id)
);

CREATE INDEX idx_attempt_answers_option ON attempt_answers (attempt_option_id);

-- =========================
-- TABLE: sessions
-- =========================
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);

-- =========================
-- TABLE: bank_questions
-- =========================
CREATE TABLE bank_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT NOT NULL,
    content VARCHAR(255) NOT NULL,
    type VARCHAR(15) NOT NULL,
    media_url VARCHAR(255),
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bank_question_creator FOREIGN KEY (creator_id) REFERENCES users (id)
);

CREATE INDEX idx_bank_questions_creator ON bank_questions (creator_id);
CREATE INDEX idx_bank_questions_category ON bank_questions (category);

-- =========================
-- TABLE: bank_answers
-- =========================
CREATE TABLE bank_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_question_id INT NOT NULL,
    content VARCHAR(255) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bank_answer_question FOREIGN KEY (bank_question_id) REFERENCES bank_questions (id) ON DELETE CASCADE
);

CREATE INDEX idx_bank_answers_question ON bank_answers (bank_question_id);

-- =========================
-- Liên kết questions với bank
-- =========================
ALTER TABLE questions
    ADD COLUMN bank_question_id INT NULL,
    ADD CONSTRAINT fk_question_bank FOREIGN KEY (bank_question_id) REFERENCES bank_questions (id) ON DELETE SET NULL;
