import axios from "@/api/axios";

export const getBankQuestions = (params) =>
  axios.get("/bank", { params }).then((res) => res.data);

export const getBankQuestionById = (id) =>
  axios.get(`/bank/${id}`).then((res) => res.data);

export const createBankQuestion = (data) =>
  axios.post("/bank", data).then((res) => res.data);

export const updateBankQuestion = (id, data) =>
  axios.patch(`/bank/${id}`, data).then((res) => res.data);

export const deleteBankQuestion = (id) =>
  axios.delete(`/bank/${id}`).then((res) => res.data);

export const importFromBank = (quizId, questionIds) =>
  axios.post(`/bank/import/${quizId}`, { questionIds }).then((res) => res.data);
