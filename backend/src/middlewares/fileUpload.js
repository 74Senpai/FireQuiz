import multer from 'multer';
import AppError from '../errors/AppError.js';

const ALLOWED_EXCEL = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];

const ALLOWED_MEDIA = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg'
];

const MAX_EXCEL_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_MEDIA_SIZE = 50 * 1024 * 1024; // 50MB cho video/ảnh

const storage = multer.memoryStorage();

const excelFilter = (req, file, cb) => {
  if (ALLOWED_EXCEL.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ chấp nhận file .xlsx', 400), false);
  }
};

const mediaFilter = (req, file, cb) => {
  if (ALLOWED_MEDIA.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Định dạng file không hợp lệ (Chỉ nhận ảnh, MP4, MP3, WAV, OGG)', 400), false);
  }
};

export const uploadExcel = multer({
  storage,
  fileFilter: excelFilter,
  limits: { fileSize: MAX_EXCEL_SIZE },
}).single('file');

export const uploadMedia = multer({
  storage,
  fileFilter: mediaFilter,
  limits: { fileSize: MAX_MEDIA_SIZE },
}).single('file');
