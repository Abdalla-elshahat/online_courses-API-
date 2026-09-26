const userService = require("../services/user.service");
const { sendIfAppError } = require("../utles/app-error");

const getAllUsers = async (req, res) => {
  try {
    res.json(await userService.getAllUsers());
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};

const sendUser = (load) => async (req, res) => {
  try {
    res.json(await load(req));
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "An error occurred" });
  }
};

// the logged-in user
const getMe = sendUser((req) => userService.getMe(req.user.id));

// another user's public profile by :id
const getUserById = sendUser((req) => userService.getProfile(req.params.id));

const updateProfile = async (req, res) => {
  try {
    const updatedUser = await userService.updateProfile(req.user.id, req.body, req.file);
    res.status(200).json({
      status: 200,
      message: "User updated successfully",
      data: { updatedUser },
    });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error updating user:", error);
    res.status(500).json({ status: 500, message: "Failed to update user" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await userService.deleteAccount(req.user.id);
    res.status(200).json({ status: 200, message: "User deleted successfully" });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error deleting user:", error);
    res.status(500).json({ status: 500, message: "Failed to delete user" });
  }
};

const updateRole = async (req, res) => {
  try {
    const data = await userService.updateRole(req.params.user_id, req.body.role);
    res.status(200).json({ status: 200, message: "User updated role successfully", data });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error updating role:", error);
    res.status(500).json({ status: 500, message: "Failed to update role" });
  }
};

module.exports = { getAllUsers, getMe, getUserById, updateProfile, deleteAccount, updateRole };
