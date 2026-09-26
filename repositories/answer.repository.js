const Answer = require("../models/Answers.model");

const create = (data) => new Answer(data).save();

const findByUserWithQuizTitle = (userId) =>
  Answer.find({ userId }).populate("quizId", "title");

const findByQuizWithUsers = (quizId) =>
  Answer.find({ quizId }).populate({ path: "userId", select: "username email" });

const findOne = (quizId, userId) => Answer.findOne({ quizId, userId });

module.exports = { create, findByUserWithQuizTitle, findByQuizWithUsers, findOne };
