import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  // log stack trace
  logger.error(err);

  const status = err.status || 500;

  res.status(status).json({
    message: err.message || "Lỗi máy chủ nội bộ"
  });
}
