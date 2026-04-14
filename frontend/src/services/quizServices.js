import axios from "@/api/axios";

/**
 * Quiz PUBLIC đang trong khung giờ mở (có phân trang, có thể gọi không cần đăng nhập)
 */
export const getPublicOpenQuizzes = (params = {}) =>
  axios.get("/quiz/public/open", { params }).then((res) => res.data);

/**
 * Lấy danh sách quiz của bản thân
 */
export const getMyQuizzes = () =>
  axios.get("/quiz/myquiz").then((res) => res.data);

/**
 * Join Quiz bằng mã PIN
 */
export const joinQuizByCode = (quizCode) =>
  axios.get(`/quiz/join/${quizCode}`).then((res) => res.data);

/**
 * Tạo Quiz mới
 */
export const createQuiz = (data) =>
  axios.post("/quiz", data).then((res) => res.data);

/**
 * Lấy chi tiết Quiz
 */
export const getQuizDetails = (id) =>
  axios.get(`/quiz/${id}`).then((res) => res.data);

/**
 * Preview Quiz
 */
export const getQuizPreview = (id) =>
  axios.get(`/quiz/${id}/preview`).then((res) => res.data);

/**
 * Lấy Leaderboard
 */
export const getQuizLeaderboard = (id) =>
  axios.get(`/quiz/${id}/leaderboard`).then((res) => res.data);

/**
 * Phân tích câu hỏi
 */
export const getQuizQuestionAnalytics = (id) =>
  axios.get(`/quiz/${id}/question-analytics`).then((res) => res.data);

/**
 * Dashboard kết quả
 */
export const getQuizResultsDashboard = (id) =>
  axios.get(`/quiz/${id}/results-dashboard`).then((res) => res.data);

/**
 * Export Excel kết quả
 */
export const exportQuizResultsExcel = (id, config = {}) =>
  axios.get(`/quiz/${id}/export/excel`, {
    responseType: "blob",
    ...config,
  });

/**
 * Export PDF kết quả
 */
export const exportQuizResultsPdf = (id, config = {}) =>
  axios.get(`/quiz/${id}/export/pdf`, {
    responseType: "blob",
    ...config,
  });

/**
 * Cập nhật trạng thái Quiz (PUBLIC, PRIVATE, DRAFT)
 */
export const updateQuizStatus = (id, status) =>
  axios.patch(`/quiz/${id}/status`, { status }).then((res) => res.data);

/**
 * Cập nhật thông tin cơ bản
 */
export const updateQuizInfo = (id, data) =>
  axios.patch(`/quiz/${id}/info`, data).then((res) => res.data);

/**
 * Cập nhật cài đặt
 */
export const updateQuizSettings = (id, data) =>
  axios.patch(`/quiz/${id}/settings`, data).then((res) => res.data);

/**
 * Xóa Quiz
 */
export const deleteQuiz = (id) =>
  axios.delete(`/quiz/${id}`);

/**
 * Sinh mã PIN
 */
export const generatePin = (id) =>
  axios.post(`/quiz/${id}/generate-pin`).then((res) => res.data);

/**
 * Xóa mã PIN
 */
export const removePin = (id) =>
  axios.delete(`/quiz/${id}/pin`).then((res) => res.data);

/**
 * Lấy file mẫu Import Excel
 */
export const getImportTemplate = (id) =>
  axios.get(`/quiz/${id}/import-excel/template`, { responseType: "blob" });

/**
 * Import câu hỏi từ Excel
 */
export const importQuestionsFromExcel = (id, formData) =>
  axios.post(`/quiz/${id}/import-excel`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((res) => res.data);
