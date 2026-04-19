import { uploadFileToSupabase, getPublicUrl } from '../services/supabaseService.js';
import * as mediaRepository from '../repositories/mediaRepository.js';
import AppError from '../errors/AppError.js';

export const uploadMediaFile = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      throw new AppError('Vui lòng cung cấp file đính kèm', 400);
    }

    // Xác định bucket dựa trên 'type' (mặc định là quiz)
    // - quiz: lưu vào SUPABASE_BUCKET (Private)
    // - avatar: lưu vào SUPABASE_AVATAR_BUCKET (Public)
    const type = req.query.type || 'quiz';
    let bucket = process.env.SUPABASE_BUCKET;
    
    if (type === 'avatar') {
      bucket = process.env.SUPABASE_AVATAR_BUCKET;
    }

    const filePath = await uploadFileToSupabase(
      file.buffer, 
      file.originalname, 
      file.mimetype,
      bucket
    );

    // GHI NHẬN QUYỀN SỞ HỮU: Chỉ dành cho các file upload vào bucket chính (private)
    if (type === 'quiz' && req.user?.userId) {
      await mediaRepository.saveMediaAsset(filePath, req.user.userId);
    }

    let returnUrl = filePath;
    if (type === 'avatar') {
      returnUrl = getPublicUrl(filePath, bucket);
    }

    res.status(200).json({
      success: true,
      message: 'Upload file thành công',
      data: {
        url: returnUrl // Trả về full url thay vì path nếu là avatar
      }
    });
  } catch (error) {
    next(error);
  }
};
