import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import AppError from '../errors/AppError.js';
import * as mediaRepository from '../repositories/mediaRepository.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
export const supabaseBucket = process.env.SUPABASE_BUCKET || 'quizzes-img';
export const supabaseAvatarBucket = process.env.SUPABASE_AVATAR_BUCKET || 'user-avatars';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials are not provided. Please set SUPABASE_URL and SUPABASE_KEY in .env");
}

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Tải file lên Supabase Storage và trả về đường dẫn (path).
 * @param {Buffer} fileBuffer - Dữ liệu file.
 * @param {string} fileName - Tên file gốc.
 * @param {string} mimeType - Mimetype.
 * @param {string} bucket - Tên bucket.
 * @returns {Promise<string>} Đường dẫn (path) của file đã upload.
 */
export const uploadFileToSupabase = async (fileBuffer, fileName, mimeType, bucket = supabaseBucket) => {
  if (!supabase) {
    throw new AppError('Dịch vụ lưu trữ chưa được cấu hình', 500);
  }

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

  // Trả về path thay vì URL đầy đủ
  return data.path;
};

/**
 * Tạo Signed URL (link tạm thời) cho file.
 * @param {string} path - Đường dẫn file.
 * @param {number} expiresSeconds - Thời gian hết hạn (giây).
 * @param {string} bucket - Tên bucket.
 * @returns {Promise<string>} Signed URL.
 */
export const createSignedUrl = async (path, expiresSeconds = 3600, bucket = supabaseBucket) => {
  if (!supabase || !path) return null;
  
  // Nếu path là URL đầy đủ (do dữ liệu cũ chưa migrate), cố gắng trích xuất path
  const actualPath = path.includes('http') ? extractPathFromUrl(path, bucket) : path;
  if (!actualPath) return path;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(actualPath, expiresSeconds);

  if (error) {
    console.error(`Error creating signed URL for ${actualPath}:`, error.message);
    return null;
  }
  return data.signedUrl;
};

/**
 * Lấy Public URL cho file (dùng cho avatar).
 */
export const getPublicUrl = (path, bucket = supabaseAvatarBucket) => {
  if (!supabase || !path) return null;
  const actualPath = path.includes('http') ? extractPathFromUrl(path, bucket) : path;
  if (!actualPath) return path;

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(actualPath);
    
  return data.publicUrl;
};

/**
 * Trích xuất path của file từ Supabase Public URL.
 * URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
 */
const extractPathFromUrl = (url, bucket = supabaseBucket) => {
  if (!url) return null;
  const searchPart = `/public/${bucket}/`;
  const parts = url.split(searchPart);
  return parts.length > 1 ? parts[1] : null;
};

/**
 * Tải file từ Supabase Storage về Buffer (hỗ trợ cả path nội bộ lẫn URL đầy đủ cũ).
 */
export const downloadFileBuffer = async (pathOrUrl, bucket = supabaseBucket) => {
  if (!supabase || !pathOrUrl) return null;

  const filePath = pathOrUrl.includes('http')
    ? extractPathFromUrl(pathOrUrl, bucket)
    : pathOrUrl;

  if (!filePath) return null;

  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error || !data) return null;

  return Buffer.from(await data.arrayBuffer());
};

/**
 * Xóa file khỏi Supabase Storage.
 */
export const deleteFileFromSupabase = async (fileUrl, bucket = supabaseBucket) => {
  if (!supabase || !fileUrl) return;

  // 1. Kiểm tra xem còn ai dùng URL này không
  const usageCount = await mediaRepository.countMediaUsage(fileUrl);
  
  if (usageCount > 0) {
    console.log(`Media skipped deletion: ${fileUrl} (Still used by ${usageCount} records)`);
    return; 
  }

  // 2. Không còn ai dùng -> Xóa thực thụ trên Supabase
  const filePath = fileUrl.includes('http') ? extractPathFromUrl(fileUrl, bucket) : fileUrl;
  if (!filePath) return;

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error(`Error deleting file from Supabase bucket ${bucket}: ${error.message}`);
  } else {
    console.log(`Media deleted from Supabase bucket ${bucket}: ${filePath}`);
  }
};
