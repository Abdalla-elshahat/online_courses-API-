const answerRepository = require("../repositories/answer.repository");
const quizRepository = require("../repositories/quiz.repository");
const { AppError } = require("../utles/app-error");

const quizNotFound = () => new AppError(404, { message: "Quiz not found" });

// grades the submitted answers and stores them; returns the saved answer document
const submitAnswers = async (userId, quizId, answers = []) => {
  const quiz = await quizRepository.findById(quizId);
  if (!quiz) throw quizNotFound();

  let score = 0;
  const userAnswers = [];
  answers.forEach(({ questionId, answer }) => {
    const question = quiz.questions.find((q) => q._id.toString() === questionId);
    if (!question) return;

    const correctAnswer = question.answers.find((ans) => ans.isCorrect);
    if (correctAnswer && correctAnswer.text === answer) score++;
    userAnswers.push({ questionId, answer });
  });

  return answerRepository.create({ quizId, userId, answers: userAnswers, score });
};

const getUserAnswers = async (userId) => {
  const answers = await answerRepository.findByUserWithQuizTitle(userId);
  if (!answers || answers.length === 0) {
    throw new AppError(404, { message: "No answers found for this user" });
  }
  return answers;
};

const getQuizAnswers = async (quizId) => {
  const answers = await answerRepository.findByQuizWithUsers(quizId);
  if (!answers || answers.length === 0) {
    throw new AppError(404, { message: "No answers found for this quiz" });
  }
  return answers;
};

const getScore = async (userId, quizId) => {
  const answer = await answerRepository.findOne(quizId, userId);
  if (!answer) {
    throw new AppError(404, { message: "No score found for this quiz" });
  }
  const quiz = await quizRepository.findById(quizId);
  if (!quiz) throw quizNotFound();

  return { score: answer.score, totalquestion: quiz.questions.length };
};

module.exports = { submitAnswers, getUserAnswers, getQuizAnswers, getScore };
