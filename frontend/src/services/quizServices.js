import axios from "@/api/axios";

export const getMyQuizzes = () =>
  axios.get("/quiz/myquiz").then((res) => res.data);

export const getQuizPreview = (id) =>
  axios.get(`/quiz/${id}/preview`).then((res) => res.data);

export const getQuizLeaderboard = (id) =>
  axios.get(`/quiz/${id}/leaderboard`).then((res) => res.data);

export const deleteQuiz = (id) =>
  axios.delete(`/quiz/${id}`);
