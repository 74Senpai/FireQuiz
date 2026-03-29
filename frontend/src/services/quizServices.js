import axios from "@/api/axios";

export const getMyQuizzes = () =>
  axios.get("/quiz/myquiz").then((res) => res.data);

export const deleteQuiz = (id) =>
  axios.delete(`/quiz/${id}`);