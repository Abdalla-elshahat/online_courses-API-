const reviewRepository = require("../repositories/review.repository");
const userRepository = require("../repositories/user.repository");
const { AppError } = require("../utles/app-error");

const reviewNotFound = () => new AppError(404, { status: 404, message: "Review not found" });

const addReview = async (userId, courseId, { rating, comment }) => {
  if (!rating || !comment) {
    throw new AppError(400, {
      status: 400,
      message: "Rating and comment are required fields.",
    });
  }
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(404, { status: 404, message: "User not found." });
  }
  return reviewRepository.create({
    courseId: String(courseId),
    userId,
    username: user.username,
    avatar: user.avatar,
    rating,
    comment,
  });
};

const getCourseReviews = (courseId) => reviewRepository.findByCourse(courseId, 10);

const updateReview = async (courseId, reviewId, { rating, comment }) => {
  const review = await reviewRepository.updateForCourse(reviewId, courseId, { rating, comment });
  if (!review) throw reviewNotFound();
  return review;
};

const deleteReview = async (courseId, reviewId) => {
  const review = await reviewRepository.deleteForCourse(reviewId, courseId);
  if (!review) throw reviewNotFound();
};

module.exports = { addReview, getCourseReviews, updateReview, deleteReview };
