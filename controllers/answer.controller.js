const answerService = require("../services/answer.service");
const { sendIfAppError } = require("../utles/app-error");

const handleError = (res, error) => {
  if (sendIfAppError(res, error)) return;
  res.status(500).json({ message: error.message });
};

const submitAnswers = async (req, res) => {
  try {
    const answer = await answerService.submitAnswers(
      req.user.id,
      req.params.quizId,
      req.body.answers
    );
    res.status(201).json({
      message: "Answers submitted successfully",
      score: answer.score,
      data: answer,
    });
  } catch (error) {
    handleError(res, error);
  }
};

const getMyAnswers = async (req, res) => {
  try {
    const data = await answerService.getUserAnswers(req.user.id);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    handleError(res, error);
  }
};

const getQuizAnswers = async (req, res) => {
  try {
    const data = await answerService.getQuizAnswers(req.params.quizId);
    res.status(200).json({ status: "success", data });
  } catch (error) {
    handleError(res, error);
  }
};

const getScore = async (req, res) => {
  try {
    const { quizId } = req.params;
    const result = await answerService.getScore(req.user.id, quizId);
    res.status(200).json({ status: "success", quizId, userId: req.user.id, ...result });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { submitAnswers, getMyAnswers, getQuizAnswers, getScore };
