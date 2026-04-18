import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();

logger.debug("Database Configuration - DB_NAME: " + process.env.DB_NAME);
logger.debug("Database Configuration - DB_USER: " + process.env.DB_USER);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Cấu hình để tránh lỗi ECONNRESET và giữ kết nối sống
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  maxIdle: 10, // Số lượng kết nối nhàn rỗi tối đa
  idleTimeout: 60000, // Thời gian (ms) trước khi một kết nối nhàn rỗi bị đóng
  ...(process.env.DB_SSL === 'true' && {
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  }),
});

export default pool;
