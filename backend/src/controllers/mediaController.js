import * as supabaseService from '../services/supabaseService.js';
import * as mediaRepository from '../repositories/mediaRepository.js';
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

  // KIỂM TRA BẢO MẬT:
  // 1. Nếu file đã được sử dụng (usageCount > 0) -> Cho phép truy cập (để hỗ trợ QR Code/Excel)
  // 2. Nếu file chưa được sử dụng (usageCount === 0) -> Chỉ cho phép người upload xem (preview)
  const usageCount = await mediaRepository.countMediaUsage(path);
  
  if (usageCount === 0) {
    // Nếu chưa được sử dụng, phải kiểm tra danh tính người upload
    if (!req.user) {
      throw new AppError('Bạn cần đăng nhập để xem bản xem trước này', 401);
    }

    const ownerId = await mediaRepository.getMediaAssetOwner(path);
    if (!ownerId || ownerId !== req.user.id) {
      throw new AppError('Tài nguyên không tồn tại hoặc bạn không có quyền truy cập', 403);
    }
  }

  // Tạo Signed URL có thời hạn ngắn (vd: 5 phút để user xem ngay)
  const signedUrl = await supabaseService.createSignedUrl(path, 300, targetBucket);

  if (!signedUrl) {
    throw new AppError('Không thể truy cập nội dung đa phương tiện này hoặc file không tồn tại', 404);
  }

  // Chuyển hướng người dùng tới link Supabase đã ký
  res.redirect(signedUrl);
});
