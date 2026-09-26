const quizService = require("../services/quiz.service");
const { sendIfAppError } = require("../utles/app-error");

// handles errors the same way for every quiz endpoint
const handleError = (res, error, fallbackStatus = 500) => {
  if (sendIfAppError(res, error)) return;
  res.status(fallbackStatus).json({ message: error.message });
};

const getAllQuizzes = async (req, res) => {
  try {
    res.status(200).json(await quizService.getAllQuizzes());
  } catch (error) {
    handleError(res, error);
  }
};

const getMyQuizzes = async (req, res) => {
  try {
    const quiz = await quizService.getQuizzesAddedBy(req.user.id);
    res.status(200).json({ status: "success", data: { quiz } });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error fetching quizzes:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const createQuiz = async (req, res) => {
  try {
    const { course_id } = req.params;
    const quiz = await quizService.createQuiz(req.user.id, course_id, req.body);
    res.status(201).json({ message: "Quiz created successfully", quiz, courseId: course_id });
  } catch (error) {
    handleError(res, error, 400);
  }
};

const getQuiz = async (req, res) => {
  try {
    res.status(200).json(await quizService.getQuizById(req.params.quizId));
  } catch (error) {
    handleError(res, error);
  }
};

const getCourseQuizzes = async (req, res) => {
  try {
    const quizzes = await quizService.getCourseQuizzes(req.params.courseId);
    res.status(200).json({ status: "success", results: quizzes.length, data: quizzes });
  } catch (error) {
    handleError(res, error);
  }
};

const updateQuiz = async (req, res) => {
  try {
    res.status(200).json(await quizService.updateQuiz(req.params.quizId, req.body));
  } catch (error) {
    handleError(res, error, 400);
  }
};

const deleteQuiz = async (req, res) => {
  try {
    await quizService.deleteQuiz(req.user.id, req.params.quizId);
    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getAllQuizzes,
  getMyQuizzes,
  createQuiz,
  getQuiz,
  getCourseQuizzes,
  updateQuiz,
  deleteQuiz,
};
