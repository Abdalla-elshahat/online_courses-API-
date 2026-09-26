const express = require("express");
const verifyToken = require("../middleware/verify-token");
const allowTo = require("../middleware/allow-to");
const { upload } = require("../middleware/handle-imges");
const userroles = require("../utles/Role-users");
const courseController = require("../controllers/course.controller");
const reviewController = require("../controllers/review.controller");
const favoriteController = require("../controllers/favorite.controller");

const router = express.Router();
const instructorOnly = [verifyToken, allowTo(userroles.ADMIN, userroles.MANGER)];

// courses (static paths must stay above "/:id")
router.get("/search", verifyToken, courseController.search);
router.get("/coursesiamadded", instructorOnly, courseController.getMyCourses);
router.get("/", courseController.listCourses);
router.get("/last_courses", courseController.getLatestCourses);
router.get("/:id", courseController.getCourse);
router.post("/add", instructorOnly, upload.single("imgcourse"), courseController.createCourse);
router.patch(
  "/update/:id",
  instructorOnly,
  upload.single("imgcourse"),
  courseController.updateCourse
);
router.delete("/delete/:id", instructorOnly, courseController.deleteCourse);
router.patch("/:courses_id/status", instructorOnly, courseController.updateStatus);

// reviews
router.post("/:courses_id/reviews", verifyToken, reviewController.addReview);
router.get("/:courses_id/reviews", verifyToken, reviewController.getReviews);
router.patch("/:course_id/reviews/:review_id", verifyToken, reviewController.updateReview);
router.delete("/:course_id/reviews/:review_id", verifyToken, reviewController.deleteReview);

// favorites
router.post("/add/favorites", verifyToken, favoriteController.addFavorite);
router.get("/all/favorites", verifyToken, favoriteController.getFavorites);
router.post("/delete/favorites", verifyToken, favoriteController.removeFavorite);

module.exports = router;
