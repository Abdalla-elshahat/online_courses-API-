const userRepository = require("../repositories/user.repository");
const fileService = require("./file.service");
const userroles = require("../utles/Role-users");
const { AppError } = require("../utles/app-error");
const { requireObjectId } = require("../utles/validate");

// max length per updatable field
const FIELD_LIMITS = {
  username: 50,
  job: 100,
  country: 60,
  description: 1000,
  socialmedia: 2000,
  skills: 5000,
};

const userNotFound = () => new AppError(404, { status: 404, message: "User not found" });

const getAllUsers = () => userRepository.findAllPublic();

// the logged-in user's own data
const getMe = async (id) => {
  const user = await userRepository.findPublicById(id);
  if (!user) throw new AppError(404, { message: "User not found" });
  return user;
};

// someone else's profile: no email, favorites or pending requests
const getProfile = async (id) => {
  requireObjectId(id, "user id");
  const user = await userRepository.findProfileById(id);
  if (!user) throw new AppError(404, { message: "User not found" });
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
  Object.entries(FIELD_LIMITS).forEach(([field, max]) => {
    const value = body[field];
    if (value === undefined) return;
    if (typeof value !== "string" || value.length > max) {
      throw new AppError(400, { status: 400, message: `${field} must be text up to ${max} characters` });
    }
    updateData[field] = value;
  });

  const current = await userRepository.findById(userId, { avatar: 1 });
  if (!current) throw userNotFound();
  if (avatarFile) updateData.avatar = await fileService.saveImage(avatarFile, "avatar");

  let updatedUser;
  try {
    updatedUser = await userRepository.updateById(
      userId,
      { $set: updateData },
      { runValidators: true }
    );
  } catch (error) {
    await fileService.deleteImage(updateData.avatar); // don't leave the new upload orphaned
    throw error;
  }
  if (!updatedUser) throw userNotFound();

  if (updateData.avatar) await fileService.deleteImage(current.avatar);
  return updatedUser;
};

const deleteAccount = async (userId) => {
  const deletedUser = await userRepository.deleteById(userId);
  if (!deletedUser) throw userNotFound();

  await userRepository.removeFromFollowLists(userId);
  await fileService.deleteImage(deletedUser.avatar);
};

const updateRole = async (userId, role) => {
  requireObjectId(userId, "user id");
  if (!Object.values(userroles).includes(role)) {
    throw new AppError(400, { status: 400, message: "Invalid role" });
  }
  const updatedUser = await userRepository.updateById(
    userId,
    { $set: { role } },
    { runValidators: true }
  );
  if (!updatedUser) throw userNotFound();
  return updatedUser;
};

module.exports = { getAllUsers, getMe, getProfile, updateProfile, deleteAccount, updateRole };
