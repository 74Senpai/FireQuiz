import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import AppError from '../errors/AppError.js';
import * as mediaRepository from '../repositories/mediaRepository.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET || 'quizzes-img';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials are not provided. Please set SUPABASE_URL and SUPABASE_KEY in .env");
}

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Tải file lên Supabase Storage và trả về public URL.
 * @param {Buffer} fileBuffer - Dữ liệu file nằm trên RAM.
 * @param {string} fileName - Tên file gốc.
 * @param {string} mimeType - Loại file (mimetype).
 * @param {string} bucket - Tên bucket (mặc định lấy từ SUPABASE_BUCKET).
 * @returns {Promise<string>} Đường dẫn public của file đã upload.
 */
export const uploadFileToSupabase = async (fileBuffer, fileName, mimeType, bucket = supabaseBucket) => {
  if (!supabase) {
    throw new AppError('Dịch vụ lưu trữ chưa được cấu hình', 500);
  }

  // Tạo tên file duy nhất để tránh trùng lặp
  const uniqueName = `${crypto.randomUUID()}-${fileName.replace(/\s+/g, '_')}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(uniqueName, fileBuffer, {
      contentType: mimeType,
      upsert: false
    });

  if (error) {
    throw new AppError(`Lỗi upload ảnh: ${error.message}`, 500);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};

/**
 * Trích xuất path của file từ Supabase Public URL.
 * URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
 */
const extractPathFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split(`/public/${supabaseBucket}/`);
  return parts.length > 1 ? parts[1] : null;
};

/**
 * Xóa file khỏi Supabase Storage nếu không còn bản ghi nào tham chiếu đến.
 * @param {string} fileUrl - URL public của file cần xóa.
 */
export const deleteFileFromSupabase = async (fileUrl) => {
  if (!supabase || !fileUrl) return;

  // 1. Kiểm tra xem còn ai dùng URL này không
  const usageCount = await mediaRepository.countMediaUsage(fileUrl);
  
  // Nếu usageCount > 0, nghĩa là vẫn còn bản ghi khác (quiz/attempt/user) đang dùng
  if (usageCount > 0) {
    console.log(`Media skipped deletion: ${fileUrl} (Still used by ${usageCount} records)`);
    return; 
  }

  // 2. Không còn ai dùng -> Xóa thực thụ trên Supabase
  const filePath = extractPathFromUrl(fileUrl);
  if (!filePath) return;

  const { error } = await supabase.storage
    .from(supabaseBucket)
    .remove([filePath]);

  if (error) {
    console.error(`Error deleting file from Supabase: ${error.message}`);
    // Không ném lỗi ra ngoài để tránh làm hỏng flow chính (như xóa câu hỏi)
  } else {
    console.log(`Media deleted from Supabase: ${filePath}`);
  }
};
