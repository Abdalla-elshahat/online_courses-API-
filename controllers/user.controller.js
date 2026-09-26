const userService = require("../services/user.service");
const { sendIfAppError } = require("../utles/app-error");

const getAllUsers = async (req, res) => {
  try {
    res.json(await userService.getAllUsers());
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
};

const sendUser = (getId) => async (req, res) => {
  try {
    res.json(await userService.getUserById(getId(req)));
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
};

// the logged-in user
const getMe = sendUser((req) => req.user.id);

// any user by :id
const getUserById = sendUser((req) => req.params.id);

const updateProfile = async (req, res) => {
  try {
    const updatedUser = await userService.updateProfile(req.user.id, req.body, req.file?.filename);
    res.status(200).json({
      status: 200,
      message: "User updated successfully",
      data: { updatedUser },
    });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    res.status(500).json({ status: 500, message: "Failed to update user", error: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await userService.deleteAccount(req.user.id);
    res.status(200).json({ status: 200, message: "User deleted successfully" });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    res.status(500).json({ status: 500, message: "Failed to delete user", error: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const data = await userService.updateRole(req.params.user_id, req.body.role);
    res.status(200).json({ status: 200, message: "User updated role successfully", data });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    res.status(500).json({ status: 500, message: "Failed to update role", error: error.message });
  }
};

module.exports = { getAllUsers, getMe, getUserById, updateProfile, deleteAccount, updateRole };
