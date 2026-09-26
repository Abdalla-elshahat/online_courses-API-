const express = require("express");
const verifyToken = require("../middleware/verify-token");
const allowTo = require("../middleware/allow-to");
const userroles = require("../utles/Role-users");
const quizController = require("../controllers/quiz.controller");
const answerController = require("../controllers/answer.controller");

const router = express.Router();
const instructorOnly = [verifyToken, allowTo(userroles.ADMIN, userroles.MANGER)];

// quizzes
router.get("/quizzes", verifyToken, quizController.getAllQuizzes);
router.get("/myquizzes", instructorOnly, quizController.getMyQuizzes);
router.post("/quizzes/:course_id", instructorOnly, quizController.createQuiz);
router.get("/quizzes/:quizId", verifyToken, quizController.getQuiz);
router.get("/quizzes/course/:courseId", verifyToken, quizController.getCourseQuizzes);
router.put("/quizzes/:quizId", instructorOnly, quizController.updateQuiz);
router.delete("/quizzes/:quizId", instructorOnly, quizController.deleteQuiz);

// answers & scores
router.post("/quizzes/:quizId/answers", verifyToken, answerController.submitAnswers);
router.get("/myanswers", verifyToken, answerController.getMyAnswers);
router.get("/quizzes/:quizId/answers", verifyToken, answerController.getQuizAnswers);
router.get("/quizzes/:quizId/score", verifyToken, answerController.getScore);

module.exports = router;
