/**
 * Media Services
 * Chú thích (FE): Quản lý các logic liên quan đến hiển thị và xử lý media từ Backend.
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:8080/api';

/**
 * Lấy URL trỏ trực tiếp tới tài nguyên media trên Backend.
 * @param {string} path - Đường dẫn file trong bucket (obfuscated UUID).
 * @param {string} bucket - Tên bucket (tùy chọn).
 * @returns {string} - URL hoàn chỉnh để gán vào các thẻ src (img/video/audio).
 */
export const getMediaViewUrl = (path, bucket = null) => {
  if (!path) return "";
  
  // Nếu đã là URL tuyệt đối (http/https), trả về luôn (tránh double-wrapping)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // Nếu là link proxy của chính mình, vẫn cần gắn token nếu chưa có
    if (path.includes('/api/media/view') && !path.includes('token=')) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        return path.includes('?') ? `${path}&token=${token}` : `${path}?token=${token}`;
      }
    }
    return path;
  }
  
  const encodedPath = encodeURIComponent(path);
  const bucketParam = bucket ? `&bucket=${bucket}` : "";
  const token = localStorage.getItem('accessToken');
  const tokenParam = token ? `&token=${token}` : "";
  
  return `${API_BASE_URL}/media/view?path=${encodedPath}${bucketParam}${tokenParam}`;
};
