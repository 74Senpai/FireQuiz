import QRCode from 'qrcode';
import path from 'path';
import { downloadFileBuffer } from '../services/supabaseService.js';

/**
 * Common color and theme tokens for reports.
 */
export const REPORT_THEME = {
  primary: 'FF1D4ED8',
  success: 'FF059669',
  successSoft: 'FFD1FAE5',
  warning: 'FFD97706',
  warningSoft: 'FFFEF3C7',
  danger: 'FFDC2626',
  dangerSoft: 'FFFEE2E2',
  slateSoft: 'FFF8FAFC',
  slateLine: 'FFE2E8F0',
  mutedText: 'FF475569',
  slateText: 'FF1E293B', // Added for consistency
};

export const PDF_FONT_REGULAR = 'report-regular';
export const PDF_FONT_BOLD = 'report-bold';

/**
 * Array shuffling utility.
 */
export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Phân tách và sắp xếp câu hỏi cho xuất bản.
 */
export const prepareQuestionsForExport = (questions, randomize = false) => {
  let sortedQuestions = [...questions];
  
  if (randomize) {
    sortedQuestions = shuffleArray(sortedQuestions).map(q => ({
      ...q,
      answers: shuffleArray(q.answers || [])
    }));
  }

  const objectiveQuestions = sortedQuestions.filter(q => q.type !== 'TEXT');
  const subjectiveQuestions = sortedQuestions.filter(q => q.type === 'TEXT');

  return [...objectiveQuestions, ...subjectiveQuestions];
};

/**
 * Tải media từ URL về Buffer.
 */
export const downloadMediaBuffer = async (url) => {
  if (!url) return null;
  try {
    return await downloadFileBuffer(url);
  } catch (error) {
    console.error('Error downloading media:', error);
    return null;
  }
};

const QR_CACHE_MAX = 200;
const qrCache = new Map();

/**
 * Tạo QR Code Buffer từ text, cache theo URL để tránh tạo lại cho cùng một media.
 * Giới hạn tối đa QR_CACHE_MAX entry, evict entry cũ nhất khi đầy.
 */
export const generateQRCodeBuffer = async (text) => {
  if (qrCache.has(text)) return qrCache.get(text);
  try {
    const buffer = await QRCode.toBuffer(text, {
      margin: 1,
      width: 100,
      color: { dark: '#000000', light: '#ffffff' }
    });
    if (qrCache.size >= QR_CACHE_MAX) {
      qrCache.delete(qrCache.keys().next().value);
    }
    qrCache.set(text, buffer);
    return buffer;
  } catch (err) {
    console.error('QR Code error:', err);
    return null;
  }
};

/**
 * Kiểm tra xem URL có phải là ảnh không dựa vào extension.
 */
export const isImageUrl = (url) => {
  if (!url) return false;
  
  if (url.includes('/api/media/view')) {
    const urlObj = new URL(url, 'http://dummy.com');
    const pathParam = urlObj.searchParams.get('path');
    if (pathParam) {
      return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(pathParam.split('?')[0]);
    }
  }

  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url.split('?')[0]);
};

/**
 * Lấy link Redirect cho media (trỏ về Frontend viewer).
 */
export const getMediaViewUrl = (path, bucket) => {
  // Lấy đường dẫn gốc của Frontend từ .env, fallback về localhost
  const frontEndUrl = process.env.FRONT_END_URL || 'http://localhost:3000';
  if (!process.env.FRONT_END_URL && process.env.NODE_ENV === 'production') {
    console.warn('[ExportUtils] FRONT_END_URL is not defined! QR codes and hyperlinks will default to localhost and fail in production.');
  }
  
  // Nếu path đã là URL tuyệt đối, chúng ta nên bóc tách lấy phần path nếu nó là link của chính mình
  let cleanPath = path;
  if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
    try {
      const url = new URL(path);
      const p = url.searchParams.get('path');
      if (p) cleanPath = p;
    } catch (e) {
      // Giữ nguyên if không parse được
    }
  }

  const encodedPath = encodeURIComponent(cleanPath);
  return `${frontEndUrl}/view-media?path=${encodedPath}${bucket ? `&bucket=${bucket}` : ''}`;
};

/**
 * Formatting Utilities
 */
export const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return "--";
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes}m ${String(remainSeconds).padStart(2, "0")}s`;
};

export const formatDateTime = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN");
};

export const formatPercentage = (value) => `${Number(value || 0).toFixed(2)}%`;

export const getCreatorDisplayName = (user) =>
  user?.full_name || user?.fullName || user?.email || 'Unknown';

export const getScheduleText = (quiz) => {
  if (!quiz.available_from && !quiz.available_until) return 'Không giới hạn';
  return `${formatDateTime(quiz.available_from)} - ${formatDateTime(quiz.available_until)}`;
};

/**
 * Tùy biến màu sắc cho báo cáo dựa trên điểm số/tỷ lệ đúng.
 */
export const getScoreTone = (score, gradingScale) => {
  const ratio = gradingScale > 0 ? score / gradingScale : 0;
  if (ratio >= 0.8) return { fill: REPORT_THEME.successSoft, font: REPORT_THEME.success };
  if (ratio >= 0.5) return { fill: REPORT_THEME.warningSoft, font: REPORT_THEME.warning };
  return { fill: REPORT_THEME.dangerSoft, font: REPORT_THEME.danger };
};

export const getAccuracyTone = (accuracy) => {
  if (accuracy >= 80) return { fill: REPORT_THEME.successSoft, font: REPORT_THEME.success };
  if (accuracy >= 50) return { fill: REPORT_THEME.warningSoft, font: REPORT_THEME.warning };
  return { fill: REPORT_THEME.dangerSoft, font: REPORT_THEME.danger };
};

/**
 * Build file name chuẩn hóa.
 */
export const buildFileName = (title, extension) => {
  const normalizedTitle = String(title || "report")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  
  const suffix = extension ? `.${extension}` : "";
  return `${normalizedTitle || "report"}${suffix}`;
};

/**
 * ABC Label generation.
 */
export const getOptionLabel = (index) => String.fromCharCode(65 + index);

/**
 * Tính toán tóm tắt kết quả (Summary statistics).
 */
export const calculateSummary = (quiz, rows) => {
  const totalParticipants = rows.length;
  const gradingScale = Number(quiz.grading_scale ?? 10);
  const totalCorrect = rows.reduce((sum, row) => sum + Number(row.correct_count ?? 0), 0);
  const totalIncorrect = rows.reduce((sum, row) => sum + Number(row.incorrect_count ?? 0), 0);
  const totalAnswered = totalCorrect + totalIncorrect;
  const averageScore = totalParticipants
    ? rows.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / totalParticipants
    : 0;
  const highestScore = totalParticipants
    ? Math.max(...rows.map((row) => Number(row.score ?? 0)))
    : 0;
  const averageDurationSeconds = totalParticipants
    ? Math.round(
        rows.reduce((sum, row) => sum + Number(row.duration_seconds ?? 0), 0) /
          totalParticipants,
      )
    : 0;
  const accuracyRate = totalAnswered ? (totalCorrect * 100) / totalAnswered : 0;

  return {
    gradingScale,
    totalParticipants,
    totalCorrect,
    totalIncorrect,
    averageScore,
    highestScore,
    averageDurationSeconds,
    accuracyRate,
  };
};
