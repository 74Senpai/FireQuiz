import multer from 'multer';
import AppError from '../errors/AppError.js';

const ALLOWED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ chấp nhận file .xlsx', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

export const uploadExcel = upload.single('file');
