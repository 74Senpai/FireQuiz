import rateLimit from 'express-rate-limit';

/**
 * Cấu hình rate limit chung cho các route gửi OTP
 * Giới hạn 5 requests mỗi 15 phút cho mỗi IP
 */
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 requests
  message: {
    message: "Bạn đã yêu cầu gửi mã quá nhiều lần. Vui lòng thử lại sau 15 phút."
  },
  standardHeaders: true, // Trả về thông tin RateLimit trong headers `RateLimit-*`
  legacyHeaders: false, // Tắt headers `X-RateLimit-*`
});

/**
 * Cấu hình rate limit mặc định cho các API routes khác
 * Nếu cần thiết trong tương lai có thể áp dụng rộng rãi hơn
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
