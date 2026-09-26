const courseService = require("../services/course.service");
const httpconstent = require("../utles/httpconstent");
const { sendIfAppError } = require("../utles/app-error");

const serverError = (res, error, message = "Internal Server Error") => {
  console.error(message, error);
  res.status(500).json({ status: 500, message });
};

const search = async (req, res) => {
  try {
    const courses = await courseService.searchCourses(req.query.q);
    res.json({ status: 200, data: { courses } });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    serverError(res, error, "An unexpected error occurred while fetching courses.");
  }
};

const getMyCourses = async (req, res) => {
  try {
    const courses = await courseService.getCoursesAddedBy(req.user.id, req.query);
    res.status(200).json({ status: "success", data: { courses } });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error fetching courses by posts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const listCourses = async (req, res) => {
  try {
    const data = await courseService.listCourses(req.query);
    res.json({ status: httpconstent.SUCCESS, data });
  } catch (error) {
    serverError(res, error);
  }
};

const getLatestCourses = async (req, res) => {
  try {
    const courses = await courseService.getLatestCourses();
    res.status(200).json({ status: 200, data: { courses } });
  } catch (error) {
    serverError(res, error);
  }
};

const getCourse = async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.status(200).json({ status: httpconstent.SUCCESS, data: { course } });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    serverError(res, error);
  }
};

const createCourse = async (req, res) => {
  try {
    const newcourse = await courseService.createCourse(req.user.id, req.body, req.file);
    res.status(201).json({ status: httpconstent.SUCCESS, data: { newcourse } });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error creating course:", error);
    res.status(500).json({
      status: httpconstent.ERROR,
      data: null,
      message: "An error occurred while creating the course",
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const updatedCourse = await courseService.updateCourse(
      req.user,
      req.params.id,
      req.body,
      req.file
    );
    res.status(200).json({ status: httpconstent.SUCCESS, data: { updatedCourse } });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error updating course:", error);
    res.status(500).json({
      status: httpconstent.ERROR,
      message: "An error occurred while updating the course.",
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const data = await courseService.deleteCourse(req.user, req.params.id);
    res.status(200).json({
      status: httpconstent.SUCCESS,
      message: "Course deleted successfully",
      data,
    });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error deleting course:", error);
    res.status(500).json({
      status: httpconstent.ERROR,
      message: "An error occurred while deleting the course.",
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const course = await courseService.updateStatus(req.user, req.params.courses_id, req.body.status);
    res.json({ status: 200, message: "Course status updated successfully", data: { course } });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    serverError(res, error);
  }
};

module.exports = {
  search,
  getMyCourses,
  listCourses,
  getLatestCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  updateStatus,
};
