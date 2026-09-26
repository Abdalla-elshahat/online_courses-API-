const quizService = require("../services/quiz.service");
const { sendIfAppError } = require("../utles/app-error");

// 400 for invalid quiz data (mongoose validation), 500 for anything else
const handleError = (res, error) => {
  if (sendIfAppError(res, error)) return;
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }
  console.error("Quiz error:", error);
  res.status(500).json({ message: "Internal server error" });
};

const getAllQuizzes = async (req, res) => {
  try {
    res.status(200).json(await quizService.getAllQuizzes(req.user));
  } catch (error) {
    handleError(res, error);
  }
};

const getMyQuizzes = async (req, res) => {
  try {
    const quiz = await quizService.getQuizzesAddedBy(req.user.id);
    res.status(200).json({ status: "success", data: { quiz } });
  } catch (error) {
    handleError(res, error);
  }
};

const createQuiz = async (req, res) => {
  try {
    const { course_id } = req.params;
    const quiz = await quizService.createQuiz(req.user, course_id, req.body);
    res.status(201).json({ message: "Quiz created successfully", quiz, courseId: course_id });
  } catch (error) {
    handleError(res, error);
  }
};

const getQuiz = async (req, res) => {
  try {
    res.status(200).json(await quizService.getQuizById(req.user, req.params.quizId));
  } catch (error) {
    handleError(res, error);
  }
};

const getCourseQuizzes = async (req, res) => {
  try {
    const quizzes = await quizService.getCourseQuizzes(req.user, req.params.courseId);
    res.status(200).json({ status: "success", results: quizzes.length, data: quizzes });
  } catch (error) {
    handleError(res, error);
  }
};

const updateQuiz = async (req, res) => {
  try {
    res.status(200).json(await quizService.updateQuiz(req.user, req.params.quizId, req.body));
  } catch (error) {
    handleError(res, error);
  }
};

const deleteQuiz = async (req, res) => {
  try {
    await quizService.deleteQuiz(req.user, req.params.quizId);
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
