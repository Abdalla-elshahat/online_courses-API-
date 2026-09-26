const favoriteService = require("../services/favorite.service");
const { sendIfAppError } = require("../utles/app-error");

const serverError = (res, error) =>
  res.status(500).json({ status: 500, message: "Internal Server Error", error: error.message });

const addFavorite = async (req, res) => {
  try {
    const { courseId } = req.body;
    await favoriteService.addFavorite(req.user.id, courseId);
    res.json({
      status: 200,
      message: "Course added to favourites successfully",
      data: { user: req.user.id, course: courseId },
    });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    serverError(res, error);
  }
};

const getFavorites = async (req, res) => {
  try {
    const data = await favoriteService.getFavorites(req.user.id);
    res.status(200).json({ status: 200, data });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    serverError(res, error);
  }
};

const removeFavorite = async (req, res) => {
  try {
    await favoriteService.removeFavorite(req.user.id, req.body.courseId);
    res.status(200).json({ status: 200, message: "Course removed from favorites successfully" });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    serverError(res, error);
  }
};

module.exports = { addFavorite, getFavorites, removeFavorite };
