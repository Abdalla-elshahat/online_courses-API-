const quizRepository = require("../repositories/quiz.repository");
const userRepository = require("../repositories/user.repository");
const courseRepository = require("../repositories/course.repository");
const { AppError } = require("../utles/app-error");

const quizNotFound = () => new AppError(404, { message: "Quiz not found" });

const getAllQuizzes = () => quizRepository.findAll();

const getQuizzesAddedBy = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(404, { message: "User not found." });
  }
  if (!user.quiz || user.quiz.length === 0) {
    throw new AppError(404, { message: "No courses found for this user." });
  }
  return quizRepository.findByIds(user.quiz.map((id) => String(id)));
};

// creates the quiz and links it to its author and course
const createQuiz = async (userId, courseId, data) => {
  const quiz = await quizRepository.create({ ...data, courseId });
  await userRepository.updateById(userId, { $push: { quiz: quiz._id } });
  await courseRepository.updateById(courseId, { $push: { quiz: quiz._id } }, { new: true });
  return quiz;
};

const getQuizById = async (quizId) => {
  const quiz = await quizRepository.findById(quizId);
  if (!quiz) throw quizNotFound();
  return quiz;
};

const getCourseQuizzes = async (courseId) => {
  const quizzes = await quizRepository.findByCourse(courseId);
  if (!quizzes || quizzes.length === 0) {
    throw new AppError(404, { message: "No quizzes found for this course" });
  }
  return quizzes;
};

const updateQuiz = async (quizId, data) => {
  const quiz = await quizRepository.updateById(quizId, data);
  if (!quiz) throw quizNotFound();
  return quiz;
};

// deletes the quiz and unlinks it from its author and course
const deleteQuiz = async (userId, quizId) => {
  const quiz = await quizRepository.findById(quizId);
  if (!quiz) throw quizNotFound();

  await userRepository.updateById(userId, { $pull: { quiz: quiz._id } });
  await courseRepository.updateById(quiz.courseId, { $pull: { quiz: quiz._id } }, { new: true });
  await quizRepository.deleteById(quizId);
};

module.exports = {
  getAllQuizzes,
  getQuizzesAddedBy,
  createQuiz,
  getQuizById,
  getCourseQuizzes,
  updateQuiz,
  deleteQuiz,
};
