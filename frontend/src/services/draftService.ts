/**
 * draftService.ts
 *
 * Quản lý draft bài làm quiz:
 *  - Lưu/đọc từ localStorage (ưu tiên hàng đầu, hoạt động offline)
 *  - Gửi lên BE theo debounce (800ms) để backup trên cache server
 *
 * Key localStorage: draft:{quizId}:{userId}
 */

import axios from '@/api/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DraftPayload {
  quizId: string | number;
  answers: Record<number, number[]>;      // questionId → [optionId, ...]
  textAnswers: Record<number, string>;    // questionId → text
  timestamp: number;
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

const buildLocalKey = (quizId: string | number, userId: string | number) =>
  `draft:${quizId}:${userId}`;

/** Ghi draft vào localStorage ngay lập tức */
export const saveLocal = (
  quizId: string | number,
  userId: string | number,
  answers: Record<number, number[]>,
  textAnswers: Record<number, string>
): void => {
  try {
    const payload: DraftPayload = {
      quizId,
      answers,
      textAnswers,
      timestamp: Date.now(),
    };
    localStorage.setItem(buildLocalKey(quizId, userId), JSON.stringify(payload));
  } catch {
    // localStorage có thể bị đầy hoặc bị block trong private mode – bỏ qua
  }
};

/** Đọc draft từ localStorage */
export const loadLocal = (
  quizId: string | number,
  userId: string | number
): DraftPayload | null => {
  try {
    const raw = localStorage.getItem(buildLocalKey(quizId, userId));
    if (!raw) return null;
    return JSON.parse(raw) as DraftPayload;
  } catch {
    return null;
  }
};

/** Xóa draft khỏi localStorage (sau khi submit xong) */
export const clearLocal = (quizId: string | number, userId: string | number): void => {
  try {
    localStorage.removeItem(buildLocalKey(quizId, userId));
  } catch {
    // ignore
  }
};

// ─── Backend API helpers ──────────────────────────────────────────────────────

/** Lưu draft lên BE cache (không ghi DB) */
export const saveToBE = (
  quizId: string | number,
  answers: Record<number, number[]>,
  textAnswers: Record<number, string>
): Promise<void> => {
  const payload: DraftPayload = {
    quizId,
    answers,
    textAnswers,
    timestamp: Date.now(),
  };
  return axios.post('/quiz/draft', payload).then(() => undefined);
};

/** Lấy draft từ BE cache (dùng khi local không có) */
export const loadFromBE = (quizId: string | number): Promise<DraftPayload | null> =>
  axios
    .get<DraftPayload>('/quiz/draft', { params: { quizId } })
    .then((res) => res.data)
    .catch(() => null);

// ─── Debounce helper ──────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Gửi draft lên BE với debounce 800ms.
 * Mỗi lần user chọn đáp án → reset timer, chỉ gọi API sau 800ms không có thay đổi.
 */
export const debouncedSaveToBE = (
  quizId: string | number,
  answers: Record<number, number[]>,
  textAnswers: Record<number, string>,
  delay = 800
): void => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveToBE(quizId, answers, textAnswers).catch(() => {
      // Mạng lỗi – bỏ qua, đã có localStorage backup
    });
  }, delay);
};
