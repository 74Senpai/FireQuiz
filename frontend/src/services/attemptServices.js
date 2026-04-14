import axios from "@/api/axios";

/** Danh sách lần thi của user (phân trang) */
export const getMyAttempts = (params = {}) =>
  axios.get("/attempt/my", { params }).then((res) => res.data);

/** Chi tiết câu hỏi / đáp án đã chọn của một lần thi */
export const getAttemptReview = (attemptId) =>
  axios.get(`/attempt/${attemptId}/review`).then((res) => res.data);

/** Bắt đầu bài thi */
export const startAttempt = (quizId) =>
  axios.post(`/attempt/start/${quizId}`).then((res) => res.data);

/** Báo cáo vi phạm (chuyển tab/mất focus) */
export const reportAttemptViolation = (attemptId) =>
  axios.patch(`/attempt/${attemptId}/violation`).then((res) => res.data);

/**
 * Nộp bài chính thức (Option A).
 * Gửi kèm toàn bộ answers + textAnswers để BE ghi DB.
 * Đây là lần DUY NHẤT đáp án được ghi vào database.
 *
 * @param {number} attemptId
 * @param {Record<number, number[]>} answers      - { questionId: [optionId, ...] }
 * @param {Record<number, string>}   textAnswers  - { questionId: "nội dung" }
 */
export const submitAttempt = (attemptId, answers = {}, textAnswers = {}) =>
  axios
    .patch(`/attempt/${attemptId}/submit`, { answers, textAnswers })
    .then((res) => res.data);

/** Thống kê điểm số */
export const getMyStats = () =>
  axios.get("/attempt/stats/my").then((res) => res.data);

