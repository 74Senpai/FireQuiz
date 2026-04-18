/**
 * Media Services
 * Chú thích (FE): Quản lý các logic liên quan đến hiển thị và xử lý media từ Backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Lấy URL trỏ trực tiếp tới tài nguyên media trên Backend.
 * @param {string} path - Đường dẫn file trong bucket (obfuscated UUID).
 * @param {string} bucket - Tên bucket (tùy chọn).
 * @returns {string} - URL hoàn chỉnh để gán vào các thẻ src (img/video/audio).
 */
export const getMediaViewUrl = (path, bucket = null) => {
  if (!path) return "";
  
  const encodedPath = encodeURIComponent(path);
  const bucketParam = bucket ? `&bucket=${bucket}` : "";
  
  return `${API_BASE_URL}/media/view?path=${encodedPath}${bucketParam}`;
};
