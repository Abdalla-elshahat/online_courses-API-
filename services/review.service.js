const reviewRepository = require("../repositories/review.repository");
const userRepository = require("../repositories/user.repository");
const courseRepository = require("../repositories/course.repository");
const { AppError } = require("../utles/app-error");
const { isAdmin, requireObjectId } = require("../utles/validate");

const reviewNotFound = () => new AppError(404, { status: 404, message: "Review not found" });

const validateReview = ({ rating, comment }) => {
  const value = Number(rating);
  if (!Number.isFinite(value) || value < 1 || value > 10) {
    throw new AppError(400, { status: 400, message: "Rating must be a number between 1 and 10." });
  }
  if (typeof comment !== "string" || !comment.trim() || comment.length > 500) {
    throw new AppError(400, { status: 400, message: "Comment must be 1 to 500 characters." });
  }
  return { rating: value, comment: comment.trim() };
};

// only the author (or an admin) may change a review
const assertCanEdit = async (actor, courseId, reviewId) => {
  requireObjectId(courseId, "course id");
  requireObjectId(reviewId, "review id");
  const review = await reviewRepository.findForCourse(reviewId, courseId);
  if (!review) throw reviewNotFound();
  if (!isAdmin(actor) && String(review.userId) !== actor.id) {
    throw new AppError(403, { status: 403, message: "You can only change your own reviews" });
  }
};

const addReview = async (userId, courseId, body) => {
  if (!body.rating || !body.comment) {
    throw new AppError(400, {
      status: 400,
      message: "Rating and comment are required fields.",
    });
  }
  const { rating, comment } = validateReview(body);
  requireObjectId(courseId, "course id");
  if (!(await courseRepository.findById(courseId))) {
    throw new AppError(404, { status: 404, message: "Course not found." });
  }
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(404, { status: 404, message: "User not found." });
  }
  return reviewRepository.create({
    courseId,
    userId,
    username: user.username,
    avatar: user.avatar,
    rating,
    comment,
  });
};

const getCourseReviews = (courseId) => {
  requireObjectId(courseId, "course id");
  return reviewRepository.findByCourse(courseId, 10);
};

const updateReview = async (actor, courseId, reviewId, body) => {
  await assertCanEdit(actor, courseId, reviewId);
  const review = await reviewRepository.updateForCourse(reviewId, courseId, validateReview(body));
  if (!review) throw reviewNotFound();
  return review;
};

const deleteReview = async (actor, courseId, reviewId) => {
  await assertCanEdit(actor, courseId, reviewId);
  const review = await reviewRepository.deleteForCourse(reviewId, courseId);
  if (!review) throw reviewNotFound();
};

module.exports = { addReview, getCourseReviews, updateReview, deleteReview };
