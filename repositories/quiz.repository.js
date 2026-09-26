const Quiz = require("../models/quiz.model");

const findAll = () => Quiz.find();

const findByIds = (ids) => Quiz.find({ _id: { $in: ids } });

const findById = (id) => Quiz.findById(id);

const findByCourse = (courseId) => Quiz.find({ courseId });

const create = (data) => new Quiz(data).save();

const updateById = (id, data) =>
  Quiz.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteById = (id) => Quiz.findByIdAndDelete(id);

module.exports = { findAll, findByIds, findById, findByCourse, create, updateById, deleteById };
