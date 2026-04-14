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
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true, 
  },
});

export default pool;
