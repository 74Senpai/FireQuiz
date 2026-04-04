import axios from "@/api/axios";

/**
 * Lấy danh sách câu hỏi theo Quiz ID
 */
export const getQuestionsByQuizId = (quizId) =>
  axios.get(`/question/${quizId}/list`).then((res) => res.data);

/**
 * Tạo câu hỏi mới
 */
export const createQuestion = (data) =>
  axios.post("/question", data).then((res) => res.data);

/**
 * Cập nhật câu hỏi
 */
export const updateQuestion = (id, data) =>
  axios.patch(`/question/${id}`, data).then((res) => res.data);

/**
 * Xóa câu hỏi
 */
export const deleteQuestion = (id) =>
  axios.delete(`/question/${id}`).then((res) => res.data);
