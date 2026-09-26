const answerRepository = require("../repositories/answer.repository");
const quizRepository = require("../repositories/quiz.repository");
const userRepository = require("../repositories/user.repository");
const { isQuizOwner } = require("./quiz.service");
const { AppError } = require("../utles/app-error");
const { requireObjectId } = require("../utles/validate");

const quizNotFound = () => new AppError(404, { message: "Quiz not found" });

// grades the submitted answers once per user and stores them; returns the saved answer document
const submitAnswers = async (userId, quizId, answers) => {
  requireObjectId(quizId, "quiz id");
  if (!Array.isArray(answers)) {
    throw new AppError(400, { message: "answers must be an array" });
  }
  const quiz = await quizRepository.findById(quizId);
  if (!quiz) throw quizNotFound();

  if (await answerRepository.findOne(quizId, userId)) {
    throw new AppError(409, { message: "You have already submitted this quiz" });
  }

  let score = 0;
  const userAnswers = [];
  const answered = new Set(); // each question counts once, whatever the client sends
  answers.forEach((item) => {
    const questionId = typeof item?.questionId === "string" ? item.questionId : null;
    if (!questionId || answered.has(questionId)) return;

    const question = quiz.questions.find((q) => q._id.toString() === questionId);
    if (!question) return;
    answered.add(questionId);

    const answer = typeof item.answer === "string" ? item.answer : "";
    const correctAnswer = question.answers.find((ans) => ans.isCorrect);
    if (correctAnswer && correctAnswer.text === answer) score++;
    userAnswers.push({ questionId, answer });
  });

  const saved = await answerRepository.create({ quizId, userId, answers: userAnswers, score });
  await userRepository.updateById(userId, { $addToSet: { quiztaken: quizId } });
  return saved;
};

const getUserAnswers = async (userId) => {
  const answers = await answerRepository.findByUserWithQuizTitle(userId);
  if (!answers || answers.length === 0) {
    throw new AppError(404, { message: "No answers found for this user" });
  }
  return answers;
};

// every student's answers: only for the quiz owner or an admin
const getQuizAnswers = async (actor, quizId) => {
  requireObjectId(quizId, "quiz id");
  const quiz = await quizRepository.findById(quizId);
  if (!quiz) throw quizNotFound();
  if (!(await isQuizOwner(actor, quiz))) {
    throw new AppError(403, { message: "Only the quiz owner can view all answers" });
  }

  const answers = await answerRepository.findByQuizWithUsers(quizId);
  if (!answers || answers.length === 0) {
    throw new AppError(404, { message: "No answers found for this quiz" });
  }
  return answers;
};

const getScore = async (userId, quizId) => {
  requireObjectId(quizId, "quiz id");
  const answer = await answerRepository.findOne(quizId, userId);
  if (!answer) {
    throw new AppError(404, { message: "No score found for this quiz" });
  }
  const quiz = await quizRepository.findById(quizId);
  if (!quiz) throw quizNotFound();

  return { score: answer.score, totalquestion: quiz.questions.length };
};

module.exports = { submitAnswers, getUserAnswers, getQuizAnswers, getScore };
