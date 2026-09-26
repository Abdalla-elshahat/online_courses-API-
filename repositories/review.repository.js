const Review = require("../models/reviews.model");

const create = (data) => new Review(data).save();

const findByCourse = (courseId, limit) =>
  Review.find({ courseId }).sort({ createdAt: -1 }).limit(limit);

const updateForCourse = (reviewId, courseId, data) =>
  Review.findOneAndUpdate({ _id: reviewId, courseId }, { $set: data }, { new: true });

const deleteForCourse = (reviewId, courseId) =>
  Review.findOneAndDelete({ _id: reviewId, courseId });

module.exports = { create, findByCourse, updateForCourse, deleteForCourse };
