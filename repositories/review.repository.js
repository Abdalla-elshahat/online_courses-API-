const Review = require("../models/reviews.model");

const create = (data) => new Review(data).save();

const findByCourse = (courseId, limit) =>
  Review.find({ courseId }).sort({ createdAt: -1 }).limit(limit);

const findForCourse = (reviewId, courseId) => Review.findOne({ _id: reviewId, courseId });

const updateForCourse = (reviewId, courseId, data) =>
  Review.findOneAndUpdate(
    { _id: reviewId, courseId },
    { $set: data },
    { new: true, runValidators: true }
  );

const deleteForCourse = (reviewId, courseId) =>
  Review.findOneAndDelete({ _id: reviewId, courseId });

module.exports = { create, findByCourse, findForCourse, updateForCourse, deleteForCourse };
