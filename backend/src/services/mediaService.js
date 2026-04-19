import * as supabaseService from './supabaseService.js';

/**
 * Service xử lý logic gắn link media (Signed hoặc Public) vào data trước khi trả về client.
 */

// Thời hạn mặc định cho Signed URL (1 giờ)
const DEFAULT_EXPIRES = 3600;

/**
 * Tạo URL Proxy Redirect để tránh lộ link thật và hỗ trợ link "vĩnh viễn" cho PDF/Excel.
 */
const getProxyUrl = (path) => {
  if (!path) return null;
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:8080';
  return `${baseUrl}/api/media/view?path=${encodeURIComponent(path)}`;
};

/**
 * Lấy Signed URL cho Quiz Thumbnail.
 */
export const getQuizThumbnailUrl = async (path) => {
  if (!path) return null;
  return await getProxyUrl(path);
};

/**
 * Lấy Signed URL cho Question Media (ảnh/video/audio).
 * @param {string} path 
 * @param {number} expiresSeconds - Thời gian hết hạn (giây).
 */
export const getQuestionMediaUrl = async (path, expiresSeconds = DEFAULT_EXPIRES) => {
  if (!path) return null;
  return getProxyUrl(path);
};

/**
 * Lấy Public URL cho User Avatar.
 */
export const getUserAvatarUrl = (path) => {
  if (!path) return null;
  return supabaseService.getPublicUrl(path);
};

/**
 * Gắn URL vào object Quiz.
 */
export const hydrateQuiz = async (quiz) => {
  if (!quiz) return quiz;
  if (quiz.thumbnail_url) {
    quiz.thumbnail_url = await getQuizThumbnailUrl(quiz.thumbnail_url);
  }
  return quiz;
};

/**
 * Gắn URL vào danh sách Quiz.
 */
export const hydrateQuizzes = async (quizzes) => {
  if (!quizzes || !quizzes.length) return quizzes;
  const promises = quizzes.map(q => hydrateQuiz(q));
  return await Promise.all(promises);
};

/**
 * Gắn URL vào danh sách Questions.
 * @param {Array} questions 
 * @param {number} expiresSeconds 
 */
export const hydrateQuestions = async (questions, expiresSeconds = DEFAULT_EXPIRES) => {
  if (!questions || !questions.length) return questions;
  const promises = questions.map(async (q) => {
    if (q.media_url) {
      q.media_url = await getQuestionMediaUrl(q.media_url, expiresSeconds);
    }
    // Hỗ trợ cả snapshot trong attempt_questions nếu có cột media_url
    return q;
  });
  return await Promise.all(promises);
};

/**
 * Gắn URL vào object User.
 */
export const hydrateUser = (user) => {
  if (!user) return user;
  if (user.avatar_url) {
    user.avatar_url = getUserAvatarUrl(user.avatar_url);
  }
  return user;
};
