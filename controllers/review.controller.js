const reviewService = require("../services/review.service");
const { sendIfAppError } = require("../utles/app-error");

const serverError = (res, error) => {
  console.error("Review error:", error);
  res.status(500).json({ status: 500, message: "Internal Server Error" });
};

const addReview = async (req, res) => {
  try {
    const review = await reviewService.addReview(req.user.id, req.params.courses_id, req.body);
    res.status(201).json({ status: 201, message: "Review added successfully", data: { review } });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    serverError(res, error);
  }
};

const getReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getCourseReviews(req.params.courses_id);
    res.json({ status: 200, data: { reviews } });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    serverError(res, error);
  }
};

const updateReview = async (req, res) => {
  try {
    const { course_id, review_id } = req.params;
    const data = await reviewService.updateReview(req.user, course_id, review_id, req.body);
    res.json({ status: 200, message: "Review updated successfully", data });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    serverError(res, error);
  }
};

const deleteReview = async (req, res) => {
  try {
    const { course_id, review_id } = req.params;
    await reviewService.deleteReview(req.user, course_id, review_id);
    res.json({ status: 200, message: "Review deleted successfully" });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    serverError(res, error);
  }
};

module.exports = { addReview, getReviews, updateReview, deleteReview };
