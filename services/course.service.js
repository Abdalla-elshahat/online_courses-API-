const courseRepository = require("../repositories/course.repository");
const userRepository = require("../repositories/user.repository");
const fileService = require("./file.service");
const httpconstent = require("../utles/httpconstent");
const { AppError } = require("../utles/app-error");
const { isAdmin, requireObjectId, escapeRegex } = require("../utles/validate");

const EDITABLE_FIELDS = ["title", "description", "price", "isPublished", "author", "status", "category"];
const SORTABLE_FIELDS = ["title", "price", "createdAt", "category", "status"];
const MAX_PAGE_SIZE = 100;

const buildSort = (sort, order) => ({
  [SORTABLE_FIELDS.includes(sort) ? sort : "title"]: order === "desc" ? -1 : 1,
});

const pickEditable = (body) =>
  EDITABLE_FIELDS.reduce((data, field) => {
    if (body[field] !== undefined) data[field] = body[field];
    return data;
  }, {});

const courseNotFound = () =>
  new AppError(404, { status: httpconstent.ERROR, message: "Course not found" });

// admins manage every course; instructors only the ones they created
const assertCanManageCourse = async (actor, courseId) => {
  requireObjectId(courseId, "course id");
  if (isAdmin(actor)) return;
  const user = await userRepository.findById(actor.id, { posts: 1 });
  if (!user || !(user.posts || []).map(String).includes(courseId)) {
    throw new AppError(403, {
      status: httpconstent.ERROR,
      message: "You can only manage your own courses",
    });
  }
};

const searchCourses = async (q) => {
  if (!q || typeof q !== "string" || q.length > 100) {
    throw new AppError(400, {
      status: 400,
      message: "'q' query parameter is required and must be a non-empty string.",
    });
  }
  const coursesList = await courseRepository.searchByTitle(escapeRegex(q));
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
  return courseRepository.findByIds(user.posts.map(String), buildSort(sort, order));
};

const listCourses = async ({ category = "all", sort, order, limit, page }) => {
  const perPage = Math.min(Math.max(parseInt(limit) || 0, 0), MAX_PAGE_SIZE); // 0 = everything
  const currentPage = Math.max(parseInt(page) || 1, 1);
  const skip = perPage ? (currentPage - 1) * perPage : 0;
  const filter = category === "all" || typeof category !== "string" ? {} : { category };

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
    throw new AppError(404, { status: 404, data: null, message: "courses not found" });
  }
  return course;
};

const createCourse = async (userId, body, imageFile) => {
  const data = pickEditable(body);
  data.imgcourse = imageFile
    ? await fileService.saveImage(imageFile, "imgcourse")
    : fileService.DEFAULT_IMAGE;

  let newcourse;
  try {
    newcourse = await courseRepository.create(data);
  } catch (error) {
    await fileService.deleteImage(data.imgcourse);
    throw error;
  }

  const owner = await userRepository.updateById(userId, { $push: { posts: newcourse._id } });
  if (!owner) {
    throw new AppError(404, { status: httpconstent.ERROR, data: null, message: "User not found" });
  }
  return newcourse;
};

const updateCourse = async (actor, courseId, body, imageFile) => {
  await assertCanManageCourse(actor, courseId);
  const course = await courseRepository.findById(courseId);
  if (!course) throw courseNotFound();

  const updateData = pickEditable(body);
  if (imageFile) updateData.imgcourse = await fileService.saveImage(imageFile, "imgcourse");

  const updatedCourse = await courseRepository.updateById(
    courseId,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (updateData.imgcourse) await fileService.deleteImage(course.imgcourse);
  return updatedCourse;
};

// deletes the course, unlinks it from every user and removes its image; returns the updated actor
const deleteCourse = async (actor, courseId) => {
  await assertCanManageCourse(actor, courseId);
  const course = await courseRepository.deleteById(courseId);
  if (!course) throw courseNotFound();

  await userRepository.updateMany(
    { $or: [{ posts: course._id }, { favorites: courseId }] },
    { $pull: { posts: course._id, favorites: courseId } }
  );
  await fileService.deleteImage(course.imgcourse);

  const owner = await userRepository.findPublicById(actor.id);
  if (!owner) {
    throw new AppError(400, { status: httpconstent.ERROR, message: "User update failed" });
  }
  return owner;
};

const updateStatus = async (actor, courseId, status) => {
  await assertCanManageCourse(actor, courseId);
  const course = await courseRepository.updateById(
    courseId,
    { status },
    { new: true, runValidators: true }
  );
  if (!course) {
    throw new AppError(404, { status: 404, message: "Course not found" });
  }
  return course;
};

module.exports = {
  assertCanManageCourse,
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
