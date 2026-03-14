import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import pool from './db/db.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';
import quizRoute from './routes/quizRoute.js';
import { errorHandler } from './middlewares/errorHandler.js';
import cookieParser from 'cookie-parser';
import { protectedRoute } from './middlewares/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cookieParser());

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("DB connected!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on ${PORT}`);
    });

  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
}

// public route
app.use('/api/auth', authRoute);
app.use('apt/quiz', quizRoute);

// private route
app.use(protectedRoute);
app.use('/api/user', userRoute);

// global exception handler
app.use(errorHandler);

startServer();

export default app;
