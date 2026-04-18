import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/*
 * dùng chung env với app (uncomment đoạn này và comment line:3)
 * const __dirname = path.dirname(fileURLToPath(import.meta.url));
 * dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
*/

const alterQueries = [
  "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);",
  "ALTER TABLE users ADD COLUMN bio TEXT;",
  "ALTER TABLE quizzes ADD COLUMN thumbnail_url VARCHAR(255);",
  "ALTER TABLE questions ADD COLUMN media_url VARCHAR(255);",
  "ALTER TABLE attempt_questions ADD COLUMN media_url VARCHAR(255);",
  "ALTER TABLE quizzes ADD COLUMN max_tab_violations INT DEFAULT 2;",
  "ALTER TABLE quizzes ADD COLUMN max_attempts_per_user INT DEFAULT NULL;",
  `CREATE TABLE IF NOT EXISTS bank_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT NOT NULL,
    content VARCHAR(255) NOT NULL,
    type CHAR(15) NOT NULL,
    media_url VARCHAR(255),
    difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
    category VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bank_question_creator FOREIGN KEY (creator_id) REFERENCES users(id)
  );`,
  "CREATE INDEX IF NOT EXISTS idx_bank_questions_creator ON bank_questions (creator_id);",
  "CREATE INDEX IF NOT EXISTS idx_bank_questions_category ON bank_questions (category);",
  `CREATE TABLE IF NOT EXISTS bank_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_question_id INT NOT NULL,
    content VARCHAR(255) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bank_answer_question FOREIGN KEY (bank_question_id) REFERENCES bank_questions(id) ON DELETE CASCADE
  );`,
  "CREATE INDEX IF NOT EXISTS idx_bank_answers_question ON bank_answers (bank_question_id);",
  "ALTER TABLE questions ADD COLUMN bank_question_id INT NULL;",
  "ALTER TABLE questions ADD CONSTRAINT fk_question_bank FOREIGN KEY (bank_question_id) REFERENCES bank_questions(id) ON DELETE SET NULL;"
];

const migrate = async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Bắt đầu cập nhật cấu trúc database...');

  try {
    for (const query of alterQueries) {
      try {
        console.log(`Đang chạy: ${query}`);
        await pool.query(query);
        console.log('✅ Thành công!');
      } catch (err) {
        // Mã ER_DUP_FIELDNAME (1060) nghĩa là cột đã tồn tại, có thể bỏ qua
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`⏭️ Cột đã tồn tại, bỏ qua lệnh...`);
        } else {
          console.error(`❌ Lỗi chạy lệnh:`, err.message);
        }
      }
    }
    console.log('🎉 Đã hoàn tất cập nhật cấu trúc Database mà KHÔNG làm mất dữ liệu!');
  } catch (error) {
    console.error('Lỗi tổng thể:', error);
  } finally {
    pool.end();
  }
};

migrate();
