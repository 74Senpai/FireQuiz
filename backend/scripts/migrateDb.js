import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const alterQueries = [
  "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255);",
  "ALTER TABLE users ADD COLUMN bio TEXT;",
  "ALTER TABLE quizzes ADD COLUMN thumbnail_url VARCHAR(255);",
  "ALTER TABLE questions ADD COLUMN media_url VARCHAR(255);",
  "ALTER TABLE attempt_questions ADD COLUMN media_url VARCHAR(255);",
  "ALTER TABLE quizzes ADD COLUMN max_tab_violations INT DEFAULT 2;",
  "ALTER TABLE users ADD COLUMN bio TEXT;",
  "ALTER TABLE quizzes ADD COLUMN max_attempts_per_user INT DEFAULT NULL;"
];

const migrate = async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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
