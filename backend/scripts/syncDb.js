import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Trỏ file .env ở thư mục backend gốc
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const initDB = async () => {
  console.log('Đang kết nối tới MySQL...');
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // Cho phép chạy nhiều command SQL trong một lần gọi (batch processing)
    multipleStatements: true, 
  });

  try {
    const sqlFilePath = path.resolve(process.cwd(), '../firequiz.sql');
    console.log(`Đang đọc file schema từ: ${sqlFilePath}`);
    
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');

    console.log('Bắt đầu đồng bộ DB từ file SQL (CẢNH BÁO: Sẽ DROP và tái tạo toàn bộ database)...');
    await pool.query(sqlContent);
    console.log('✅ Đã khởi tạo và đồng bộ Database thành công!');
    
  } catch (error) {
    console.error('❌ Có lỗi xảy ra trong quá trình sync Database:');
    console.error(error);
  } finally {
    pool.end();
  }
};

initDB();
