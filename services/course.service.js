const courseRepository = require("../repositories/course.repository");
const userRepository = require("../repositories/user.repository");
const httpconstent = require("../utles/httpconstent");
const { AppError } = require("../utles/app-error");

const DEFAULT_IMAGE = "no-photo-available-icon-20.jpg";

const buildSort = (sort = "title", order) => ({ [sort]: order === "desc" ? -1 : 1 });

const searchCourses = async (q) => {
  if (!q || typeof q !== "string") {
    throw new AppError(400, {
      status: 400,
      message: "'q' query parameter is required and must be a non-empty string.",
    });
  }
  const coursesList = await courseRepository.searchByTitle(q);
  if (!coursesList || coursesList.length === 0) {
    throw new AppError(404, {
      status: 404,
      message: "No courses found matching the search criteria.",
    });
  }
  return coursesList;
};

const getCoursesAddedBy = async (userId, { sort, order }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(404, { message: "User not found." });
  }
  if (!user.posts || user.posts.length === 0) {
    throw new AppError(404, { message: "No courses found for this user." });
  }
  const postIds = user.posts.map((post) => String(post));
  return courseRepository.findByIds(postIds, buildSort(sort, order));
};

const listCourses = async ({ category = "all", sort, order, limit, page }) => {
  const perPage = parseInt(limit) || 0; // 0 = return everything
  const currentPage = parseInt(page) || 1;
  const skip = perPage ? (currentPage - 1) * perPage : 0;
  const filter = category === "all" ? {} : { category };

  const [totalCount, courses] = await Promise.all([
    courseRepository.count(filter),
    courseRepository.findPage(filter, buildSort(sort, order), skip, perPage),
  ]);

  return {
    courses,
    pagination: {
      totalItems: totalCount,
      totalPages: perPage ? Math.ceil(totalCount / perPage) : 1,
      currentPage,
      limitPerPage: perPage || totalCount,
    },
  };
};

const getLatestCourses = () => courseRepository.findLatest(10);

const getCourseById = async (id) => {
  const course = await courseRepository.findById(id).catch(() => null); // invalid id => not found
  if (!course) {
    throw new AppError(404, {
      status: 404,
      data: null,
      message: "courses not found",
    });
  }
  return course;
};

const createCourse = async (userId, body, imageFile) => {
  const { title, description, price, isPublished, author, status, category } = body;
  const newcourse = await courseRepository.create({
    title,
    description,
    price,
    isPublished,
    author,
    status,
    category,
    imgcourse: imageFile || DEFAULT_IMAGE,
  });

  const owner = await userRepository.updateById(userId, { $push: { posts: newcourse._id } });
  if (!owner) {
    throw new AppError(404, { status: httpconstent.ERROR, data: null, message: "User not found" });
  }
  return newcourse;
};

const updateCourse = async (courseId, body, imageFile) => {
  const course = await courseRepository.findById(courseId);
  if (!course) {
    throw new AppError(404, { status: httpconstent.ERROR, message: "Course not found" });
  }
  const updateData = { ...body };
  if (imageFile) updateData.imgcourse = imageFile;

  return courseRepository.updateById(courseId, { $set: updateData }, { new: true });
};

// deletes the course and removes it from the owner's posts; returns the updated owner
const deleteCourse = async (userId, courseId) => {
  const course = await courseRepository.deleteById(courseId);
  if (!course) {
    throw new AppError(404, { status: httpconstent.ERROR, message: "Course not found" });
  }
  const owner = await userRepository.updateById(userId, { $pull: { posts: course._id } });
  if (!owner) {
    throw new AppError(400, { status: httpconstent.ERROR, message: "User update failed" });
  }
  return owner;
};

const updateStatus = async (courseId, status) => {
  const course = await courseRepository.updateById(courseId, { status }, { new: true });
  if (!course) {
    throw new AppError(404, { status: 404, message: "Course not found" });
  }
  return course;
};

module.exports = {
  searchCourses,
  getCoursesAddedBy,
  listCourses,
  getLatestCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  updateStatus,
};
