import { uploadFileToSupabase, deleteFileFromSupabase } from '../services/supabaseService.js';
import AppError from '../errors/AppError.js';

export const uploadMediaFile = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      throw new AppError('Vui lòng cung cấp file đính kèm', 400);
    }

    const fileUrl = await uploadFileToSupabase(
      file.buffer, 
      file.originalname, 
      file.mimetype
    );

    res.status(200).json({
      success: true,
      message: 'Upload file thành công',
      data: {
        url: fileUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMediaFile = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      throw new AppError('Vui lòng cung cấp URL file cần xóa', 400);
    }

    // deleteFileFromSupabase đã có logic check usage count
    await deleteFileFromSupabase(url);

    res.status(200).json({
      success: true,
      message: 'Yêu cầu xóa file đã được xử lý (file chỉ bị xóa nếu không còn ai sử dụng)'
    });
  } catch (error) {
    next(error);
  }
};
