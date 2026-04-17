import NodeCache from 'node-cache';

/**
 * In-memory cache dùng để lưu draft bài làm của user.
 * TTL mặc định = DRAFT_TTL_SECONDS (env) hoặc 3600 giây (1 giờ).
 * Có thể thay bằng Redis client mà không cần sửa nơi khác –
 * chỉ cần implement get/set/del tương tự phía dưới.
 */
const TTL = parseInt(process.env.DRAFT_TTL_SECONDS || '3600', 10);

const cache = new NodeCache({ stdTTL: TTL, checkperiod: 120 });

/**
 * Tạo cache key chuẩn cho draft.
 * Pattern: quiz:{quizId}:user:{userId}
 */
export const buildDraftKey = (quizId, userId) => `quiz:${quizId}:user:${userId}`;

/** Đọc draft từ cache */
export const getCache = (key) => cache.get(key) ?? null;

/** Ghi draft vào cache (TTL theo cấu hình) */
export const setCache = (key, value, ttl = TTL) => cache.set(key, value, ttl);

/** Xóa draft khỏi cache */
export const delCache = (key) => cache.del(key);
