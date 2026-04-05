import axios from "@/api/axios";

export const getMyQuizzes = () =>
  axios.get("/quiz/myquiz").then((res) => res.data);

export const getQuizPreview = (id) =>
  axios.get(`/quiz/${id}/preview`).then((res) => res.data);

export const getQuizLeaderboard = (id) =>
  axios.get(`/quiz/${id}/leaderboard`).then((res) => res.data);

export const getQuizQuestionAnalytics = (id) =>
  axios.get(`/quiz/${id}/question-analytics`).then((res) => res.data);

export const getQuizResultsDashboard = (id) =>
  axios.get(`/quiz/${id}/results-dashboard`).then((res) => res.data);

export const exportQuizResultsExcel = (id) =>
  axios.get(`/quiz/${id}/export/excel`, { responseType: "blob" });

export const exportQuizResultsPdf = (id) =>
  axios.get(`/quiz/${id}/export/pdf`, { responseType: "blob" });

export const deleteQuiz = (id) =>
  axios.delete(`/quiz/${id}`);
