const userRepository = require("../repositories/user.repository");
const { AppError } = require("../utles/app-error");

const UPDATABLE_FIELDS = ["username", "job", "socialmedia", "country", "description", "skills"];

const getAllUsers = () => userRepository.findAllPublic();

const getUserById = async (id) => {
  const user = await userRepository.findPublicById(id);
  if (!user) {
    throw new AppError(404, { message: "User not found" });
  }
  return user;
};

const updateProfile = async (userId, body, avatarFile) => {
  const { username, socialmedia, country, description, skills } = body;
  if (!username && !avatarFile && !socialmedia && !country && !description && !skills) {
    throw new AppError(400, {
      status: 400,
      message:
        "At least one field (username, avatar, job, socialmedia, country, or description) must be provided for update",
    });
  }

  const updateData = {};
  if (avatarFile) updateData.avatar = avatarFile;
  UPDATABLE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) updateData[field] = body[field];
  });

  const updatedUser = await userRepository.updateById(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!updatedUser) {
    throw new AppError(404, { status: 404, message: "User not found" });
  }
  return updatedUser;
};

const deleteAccount = async (userId) => {
  const deletedUser = await userRepository.deleteById(userId);
  if (!deletedUser) {
    throw new AppError(404, { status: 404, message: "User not found" });
  }
};

const updateRole = async (userId, role) => {
  const updatedUser = await userRepository.updateById(
    userId,
    { $set: { role } },
    { new: true, runValidators: true }
  );
  if (!updatedUser) {
    throw new AppError(404, { status: 404, message: "User not found" });
  }
  return updatedUser;
};

module.exports = { getAllUsers, getUserById, updateProfile, deleteAccount, updateRole };
