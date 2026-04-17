import * as supabaseService from '../services/supabaseService.js';
import AppError from '../errors/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Endpoint xử lý redirect tới media trên private bucket.
 * Link này dùng cho QR Code trong PDF và link trong Excel.
 */
export const handleMediaRedirect = asyncHandler(async (req, res) => {
  const { path, bucket } = req.query;

  if (!path) {
    throw new AppError('Thiếu đường dẫn file', 400);
  }

  // Tùy chọn bucket (mặc định là quizzes-img của hệ thống)
  const targetBucket = bucket || supabaseService.supabaseBucket;

  // Tạo Signed URL có thời hạn ngắn (vd: 5 phút để user xem ngay)
  const signedUrl = await supabaseService.createSignedUrl(path, 300, targetBucket);

  if (!signedUrl) {
    throw new AppError('Không thể truy cập nội dung đa phương tiện này hoặc file không tồn tại', 404);
  }

  // Chuyển hướng người dùng tới link Supabase đã ký
  res.redirect(signedUrl);
});
