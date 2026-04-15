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

/** Nộp bài thi */
export const submitAttempt = (attemptId) =>
  axios.patch(`/attempt/${attemptId}/submit`).then((res) => res.data);

/** Đồng bộ đáp án (hỗ trợ cả mảng cho Multiple Choice và chuỗi cho Text) */
export const syncAttemptAnswer = (attemptId, attemptQuestionId, attemptOptionIds, textAnswer = null) => {
  const payload = {
    attemptQuestionId,
    attemptOptionIds: Array.isArray(attemptOptionIds) ? attemptOptionIds : (attemptOptionIds ? [attemptOptionIds] : []),
    textAnswer,
  };
  return axios.patch(`/attempt/${attemptId}/answer`, payload).then((res) => res.data);
};

/** Lấy thống kê lịch sử thi (Dùng cho biểu đồ) */
export const getMyStats = () =>
  axios.get("/attempt/stats/my").then((res) => res.data);

