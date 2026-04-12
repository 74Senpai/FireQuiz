import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import AppError from '../errors/AppError.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Dùng role key hoặc service_role key

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
 * @param {string} bucket - Tên bucket public (mặc định 'firequiz-assets').
 * @returns {Promise<string>} Đường dẫn public của file đã upload.
 */
export const uploadFileToSupabase = async (fileBuffer, fileName, mimeType, bucket = 'firequiz-assets') => {
  if (!supabase) {
    throw new AppError('Dịch vụ lưu trữ chưa được cấu hình', 500);
  }

  // Tạo tên file duy nhất để tránh trùng lặp
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${fileName.replace(/\s+/g, '_')}`;

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
