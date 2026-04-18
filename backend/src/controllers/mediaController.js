import * as supabaseService from '../services/supabaseService.js';
import { countMediaUsage } from '../repositories/mediaRepository.js';
import AppError from '../errors/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const ALLOWED_BUCKETS = new Set([supabaseService.supabaseBucket]);

/**
 * Endpoint xử lý redirect tới media trên private bucket.
 * Link này dùng cho QR Code trong PDF và link trong Excel.
 */
export const handleMediaRedirect = asyncHandler(async (req, res) => {
  const { path, bucket } = req.query;

  if (!path) {
    throw new AppError('Thiếu đường dẫn file', 400);
  }

  const targetBucket = bucket || supabaseService.supabaseBucket;

  if (!ALLOWED_BUCKETS.has(targetBucket)) {
    throw new AppError('Bucket không được phép truy cập', 403);
  }

  const usageCount = await countMediaUsage(path);
  if (usageCount === 0) {
    throw new AppError('Tài nguyên không tồn tại hoặc không được phép truy cập', 404);
  }

  // Tạo Signed URL có thời hạn ngắn (vd: 5 phút để user xem ngay)
  const signedUrl = await supabaseService.createSignedUrl(path, 300, targetBucket);

  if (!signedUrl) {
    throw new AppError('Không thể truy cập nội dung đa phương tiện này hoặc file không tồn tại', 404);
  }

  // Chuyển hướng người dùng tới link Supabase đã ký
  res.redirect(signedUrl);
});
