import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import cors from 'cors'; // 1. Import cors
import pool from './db/db.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';
import quizRoute from './routes/quizRoute.js';
import questionRoute from './routes/questionRoute.js';
import attemptRoute from './routes/attemptRoute.js';
import uploadRoute from './routes/uploadRoute.js';
import mediaRoute from './routes/mediaRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import cookieParser from 'cookie-parser';
import { protectedRoute } from './middlewares/authMiddleware.js';
import logger from './utils/logger.js';
import requestLogger from './middlewares/requestLogger.js';

const app = express();
const PORT = process.env.PORT || 8080;
const originURL = process.env.FRONT_END_URL || 'http://localhost:3000';

// 2. Cấu hình CORS
app.use(cors({
  origin: originURL,
  credentials: true,               // Cho phép gửi cookie/token qua lại
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Các phương thức HTTP được phép
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition', 'Content-Length']
}));

app.use(requestLogger);

app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());



async function startServer() {
  try {
    await pool.query("SELECT 1");
    logger.info("Database connected successfully!");

    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on port ${PORT}`);
    });

  } catch (err) {
    logger.error("Database connection failed:", err);
    process.exit(1);
  }
}

// public route
app.use('/api/auth', authRoute);
app.use('/api/quiz', quizRoute);
app.use('/api/question', questionRoute);
app.use('/api/media', mediaRoute);

// private route
app.use(protectedRoute);
app.use('/api/user', userRoute);
app.use('/api/attempt', attemptRoute);
app.use('/api/upload', uploadRoute);

// global exception handler
app.use(errorHandler);

startServer();

export default app;
