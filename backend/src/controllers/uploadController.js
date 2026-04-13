import { uploadFileToSupabase } from '../services/supabaseService.js';
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

    res.status(200).json({
      success: true,
      message: 'Upload file thành công',
      data: {
        url: filePath // Bây giờ chỉ trả về path
      }
    });
  } catch (error) {
    next(error);
  }
};

// Xóa bỏ deleteMediaFile vì nguy cơ bảo mật



