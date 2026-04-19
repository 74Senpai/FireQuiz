import * as supabaseService from './supabaseService.js';

/**
 * Service xử lý logic gắn link media (Signed hoặc Public) vào data trước khi trả về client.
 */

// Thời hạn mặc định cho Signed URL (1 giờ)
const DEFAULT_EXPIRES = 3600;

/**
 * Tạo URL Proxy Redirect để tránh lộ link thật và hỗ trợ link "vĩnh viễn" cho PDF/Excel.
 * @param {string} path 
 */
const getProxyUrl = (path) => {
  if (!path) return null;
  
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:8080';
  if (!process.env.BACKEND_URL && process.env.NODE_ENV === 'production') {
    console.warn('[MediaService] BACKEND_URL is not defined! Media proxy links will default to localhost and fail in production.');
  }
  return `${baseUrl}/api/media/view?path=${encodeURIComponent(path)}`;
};

/**
 * Lấy Proxy URL cho Quiz Thumbnail.
 */
export const getQuizThumbnailUrl = async (path) => {
  if (!path) return null;
  return getProxyUrl(path);
};

/**
 * Lấy Proxy URL cho Question Media (ảnh/video/audio).
 */
export const getQuestionMediaUrl = async (path) => {
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
 */
export const hydrateQuestions = async (questions) => {
  if (!questions || !questions.length) return questions;
  const promises = questions.map(async (q) => {
    if (q.media_url) {
      q.media_url = await getQuestionMediaUrl(q.media_url);
    }
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
