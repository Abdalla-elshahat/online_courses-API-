const quizRepository = require("../repositories/quiz.repository");
const userRepository = require("../repositories/user.repository");
const courseRepository = require("../repositories/course.repository");
const { assertCanManageCourse } = require("./course.service");
const { AppError } = require("../utles/app-error");
const { isAdmin, requireObjectId } = require("../utles/validate");

const EDITABLE_FIELDS = ["title", "questions", "author", "category", "isPublished", "timeLimit"];

const quizNotFound = () => new AppError(404, { message: "Quiz not found" });

const pickEditable = (body) =>
  EDITABLE_FIELDS.reduce((data, field) => {
    if (body[field] !== undefined) data[field] = body[field];
    return data;
  }, {});

// admins, the quiz author, or (for older quizzes without userId) whoever has it in their list
const isQuizOwner = async (actor, quiz) => {
  if (isAdmin(actor)) return true;
  if (quiz.userId) return String(quiz.userId) === actor.id;
  const user = await userRepository.findById(actor.id, { quiz: 1 });
  return Boolean(user && (user.quiz || []).map(String).includes(String(quiz._id)));
};

const assertQuizOwner = async (actor, quiz) => {
  if (!(await isQuizOwner(actor, quiz))) {
    throw new AppError(403, { message: "You can only manage your own quizzes" });
  }
};

// students must not see which answer is correct
const hideCorrectAnswers = (quiz) => {
  const data = quiz.toObject ? quiz.toObject() : quiz;
  return {
    ...data,
    questions: (data.questions || []).map((q) => ({
      ...q,
      answers: (q.answers || []).map(({ isCorrect, ...answer }) => answer),
    })),
  };
};

const forViewer = async (actor, quiz) =>
  (await isQuizOwner(actor, quiz)) ? quiz : hideCorrectAnswers(quiz);

const getAllQuizzes = async (actor) => {
  const quizzes = await quizRepository.findAll();
  return isAdmin(actor) ? quizzes : quizzes.map(hideCorrectAnswers);
};

const getQuizzesAddedBy = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(404, { message: "User not found." });
  }
  if (!user.quiz || user.quiz.length === 0) {
    throw new AppError(404, { message: "No courses found for this user." });
  }
  return quizRepository.findByIds(user.quiz.map(String));
};

// creates the quiz on a course the actor manages and links it to its author and course
const createQuiz = async (actor, courseId, body) => {
  await assertCanManageCourse(actor, courseId);
  if (!(await courseRepository.findById(courseId))) {
    throw new AppError(404, { message: "Course not found" });
  }

  const quiz = await quizRepository.create({ ...pickEditable(body), courseId, userId: actor.id });
  await userRepository.updateById(actor.id, { $push: { quiz: quiz._id } });
  await courseRepository.updateById(courseId, { $push: { quiz: quiz._id } }, { new: true });
  return quiz;
};

const getQuizById = async (actor, quizId) => {
  requireObjectId(quizId, "quiz id");
  const quiz = await quizRepository.findById(quizId);
  if (!quiz) throw quizNotFound();
  return forViewer(actor, quiz);
};

const getCourseQuizzes = async (actor, courseId) => {
  requireObjectId(courseId, "course id");
  const quizzes = await quizRepository.findByCourse(courseId);
  if (!quizzes || quizzes.length === 0) {
    throw new AppError(404, { message: "No quizzes found for this course" });
  }
  return Promise.all(quizzes.map((quiz) => forViewer(actor, quiz)));
};

const updateQuiz = async (actor, quizId, body) => {
  requireObjectId(quizId, "quiz id");
  const existing = await quizRepository.findById(quizId);
  if (!existing) throw quizNotFound();
  await assertQuizOwner(actor, existing);

  const quiz = await quizRepository.updateById(quizId, pickEditable(body));
  if (!quiz) throw quizNotFound();
  return quiz;
};

// deletes the quiz and unlinks it from its author and course
const deleteQuiz = async (actor, quizId) => {
  requireObjectId(quizId, "quiz id");
  const quiz = await quizRepository.findById(quizId);
  if (!quiz) throw quizNotFound();
  await assertQuizOwner(actor, quiz);

  await userRepository.updateMany({ quiz: quiz._id }, { $pull: { quiz: quiz._id } });
  await courseRepository.updateById(quiz.courseId, { $pull: { quiz: quiz._id } }, { new: true });
  await quizRepository.deleteById(quizId);
};

module.exports = {
  isQuizOwner,
  getAllQuizzes,
  getQuizzesAddedBy,
  createQuiz,
  getQuizById,
  getCourseQuizzes,
  updateQuiz,
  deleteQuiz,
};
