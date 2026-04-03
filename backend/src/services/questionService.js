import * as questionRepository from '../repositories/questionRepository.js';
import * as answerRepository from '../repositories/answerRepository.js'; // Import thêm
import { getQuizById } from '../repositories/quizRepository.js';
import AppError from '../errors/AppError.js';

const buildAnswersByQuestionIdMap = (answers) =>
  answers.reduce((acc, answer) => {
    if (!acc.has(answer.question_id)) {
      acc.set(answer.question_id, []);
    }

    acc.get(answer.question_id).push(answer);
    return acc;
  }, new Map());

export const createQuestion = async (user, data) => {
  const { content, type, quizId, answers } = data; // Nhận thêm answers
  
  // 1. Validate loại câu hỏi
  const allowedTypes = ['MULTI_ANSWERS', 'ANANSWER', 'TEXT'];
  if (!allowedTypes.includes(type)) throw new AppError("Loại câu hỏi không hợp lệ", 400);

  // 2. Validate đáp án (Phải có đúng 4 đáp án và 1 đáp án đúng cho loại ANANSWER)
  if (type === 'ANANSWER') {
    if (!answers || answers.length !== 4) {
      throw new AppError(`Câu hỏi trắc nghiệm phải có đúng 4 lựa chọn (${answers.length})`, 400);
    }
    const correctCount = answers.filter(a => a.isCorrect === true).length;
    if (correctCount !== 1) {
      throw new AppError("Phải có duy nhất 1 đáp án đúng", 400);
    }
  }

  // 3. Tạo câu hỏi trước để lấy ID
  const questionId = await questionRepository.create({ content, type, quizId });

  // 4. Tạo các đáp án liên kết với questionId vừa tạo
  if (answers && answers.length > 0) {
    const answerPromises = answers.map(ans => 
      answerRepository.createAnswer({
        content: ans.content,
        isCorrect: ans.isCorrect,
        questionId: questionId
      })
    );
    await Promise.all(answerPromises);
  }

  return questionId;
};

// Cập nhật hàm lấy danh sách để lấy luôn cả câu trả lời
export const getListQuestionByQuizId = async (quizId, user) => {
  const quiz = await getQuizById(quizId);
  if (!quiz) throw new AppError("Quiz không tồn tại", 404);

  // Kiểm tra quyền truy cập (owner hoặc public)
  const isOwner = user && user.id === quiz.creator_id;
  if (!isOwner && quiz.status === "DRAFT") throw new AppError("Không có quyền", 403);

  const questions = await questionRepository.getListQuestionByQuizId(quizId);

  // Với mỗi câu hỏi, lấy thêm các đáp án của nó
  const answers = await answerRepository.getAnswersByQuestionIds(
    questions.map((question) => question.id),
  );
  const answersByQuestionId = buildAnswersByQuestionIdMap(answers);
  const questionsWithAnswers = questions.map((question) => ({
    ...question,
    answers: answersByQuestionId.get(question.id) || [],
  }));

  return questionsWithAnswers;
};

const checkType = (type) => {
  const allowedTypes = ['MULTI_ANSWERS', 'ANANSWER', 'TEXT'];

  if (!allowedTypes.includes(type)) {
    throw new AppError("Loại câu hỏi không hợp lệ", 400);
  }
}

// export const createQuestion = async (user, data) => {
//   const { content, type, quizId } = data;
//   checkType(type);
//   console.log(`info: in questionService.js:16 content: ${content}, type: ${type}, quizId: ${quizId}`);
//   const id = await questionRepository.create({ content, type, quizId});
//   return id;
// };

const checkQuestionExistAndOwner = async (questionId, userId) => {
  const question = await questionRepository.findQuestionById(questionId);

  if (!question) {
    throw new AppError("Câu hỏi không tồn tại", 400);
  }

  const quiz = await getQuizById(question.quiz_id);

  if (!quiz) {
    throw new AppError("Câu hỏi không tồn tại", 400);
  }
  
  console.log(`info: in questionService.js:34 quiz.creator_id: ${quiz.creator_id}, userId: ${userId}`);

  if (quiz.creator_id != userId) {
    throw new AppError("Bạn không có quyền thực hiện hành động này", 403);
  }
};

export const changeType = async (questionId, userId, type) => {  
  await checkQuestionExistAndOwner(questionId, userId);

  if (type) {
    checkType(type);
  } else {
    return;
  }

  await questionRepository.changeType(questionId, type);
};

export const changeContent = async (questionId, userId, content) => {
  await checkQuestionExistAndOwner(questionId, userId);

  await questionRepository.changeContent(questionId, content);
};

export const updateQuestion = async (questionId, userId, data) => {
  const { type, content } = data;
  await changeType(questionId, userId, type);
  await changeContent(questionId, userId, content);
}

export const deleteQuestion = async (questionId, userId) => {
  await checkQuestionExistAndOwner(questionId, userId);

  await questionRepository.deleteQuestionById(questionId);
};

const checkQuizAccess = (quiz, user) => {
  const isOwner = user && user.id === quiz.creator_id;

  if (!isOwner && (quiz.status === "DRAFT" || quiz.status === "PRIVATE")) {
    throw new AppError("Quiz không tồn tại hoặc bạn không có quyền truy cập", 403);
  }
};

export const getQuestionById = async (questionId, user) => {
  const question = await questionRepository.findQuestionById(questionId);

  if (!question) {
    throw new AppError("Question không tồn tại", 404);
  }

  const quiz = await getQuizById(question.quiz_id);

  checkQuizAccess(quiz, user);

  return question;
};

// export const getListQuestionByQuizId = async (quizId, user) => {
//   const quiz = await getQuizById(quizId);

//   if (!quiz) {
//     throw new AppError("Quiz không tồn tại", 404);
//   }

//   checkQuizAccess(quiz, user);

//   const questions = await questionRepository.getListQuestionByQuizId(quizId);

//   return questions;
// };
