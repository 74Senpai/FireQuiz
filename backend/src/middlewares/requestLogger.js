import morgan from 'morgan';
import logger from '../utils/logger.js';

const stream = {
  // Use the http severity
  write: (message) => logger.info(message.trim()),
};

const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env !== 'development';
};

const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);

export default requestLogger;
