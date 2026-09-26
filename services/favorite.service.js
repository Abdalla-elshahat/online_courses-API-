const userRepository = require("../repositories/user.repository");
const courseRepository = require("../repositories/course.repository");
const { AppError } = require("../utles/app-error");

const userNotFound = () => new AppError(404, { status: 404, message: "User not found" });

const addFavorite = async (userId, courseId) => {
  const user = await userRepository.updateById(userId, { $addToSet: { favorites: courseId } });
  if (!user) throw userNotFound();
};

const getFavorites = async (userId) => {
  const user = await userRepository.findById(userId, { favorites: 1 });
  if (!user) throw userNotFound();

  const favoriteCourses = await courseRepository.findByIds(user.favorites || []);
  return favoriteCourses.map((course) => ({
    id: course._id,
    title: course.title,
    price: course.price,
    description: course.description,
    isPublished: course.isPublished,
    author: course.author,
    status: course.status,
  }));
};

const removeFavorite = async (userId, courseId) => {
  const user = await userRepository.findById(userId, { favorites: 1 });
  if (!user) throw userNotFound();

  if (!user.favorites || !user.favorites.includes(courseId)) {
    throw new AppError(404, { status: 404, message: "Course not found in user's favorites" });
  }
  await userRepository.updateOne({ _id: userId }, { $pull: { favorites: courseId } });
};

module.exports = { addFavorite, getFavorites, removeFavorite };
