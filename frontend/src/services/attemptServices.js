import axios from "@/api/axios";

/** Danh sách lần thi của user (phân trang) */
export const getMyAttempts = (params = {}) =>
  axios.get("/attempt/my", { params }).then((res) => res.data);

/** Chi tiết câu hỏi / đáp án đã chọn của một lần thi */
export const getAttemptReview = (attemptId) =>
  axios.get(`/attempt/${attemptId}/review`).then((res) => res.data);
