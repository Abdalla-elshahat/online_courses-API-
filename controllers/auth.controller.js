const authService = require("../services/auth.service");
const { sendIfAppError } = require("../utles/app-error");

const signup = async (req, res) => {
  try {
    const user = await authService.signup(req.body, req.file?.filename);
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error during signup:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
};

const login = async (req, res) => {
  try {
    const token = await authService.login(req.body, req.cookies.token);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

const logout = (req, res) => {
  if (!req.cookies.token) {
    return res.status(400).json({ message: "No token found in cookies" });
  }
  res.clearCookie("token", { httpOnly: true, secure: true });
  res.status(200).json({ message: "Logout successful" });
};

const updatePassword = async (req, res) => {
  try {
    const data = await authService.updatePassword(req.user.id, req.body);
    res.status(200).json({ status: 200, message: "Password updated successfully", data });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error updating password:", error);
    res.status(500).json({
      status: 500,
      message: "Failed to update password",
      error: error.message,
    });
  }
};

module.exports = { signup, login, logout, updatePassword };
