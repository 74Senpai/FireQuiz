import { uploadFileToSupabase } from '../services/supabaseService.js';
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
