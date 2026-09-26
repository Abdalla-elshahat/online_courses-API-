const authService = require("../services/auth.service");
const { readBearerToken } = require("../middleware/verify-token");
const { sendIfAppError } = require("../utles/app-error");

const signup = async (req, res) => {
  try {
    const user = await authService.signup(req.body, req.file);
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    if (sendIfAppError(res, error)) return;
    console.error("Error during signup:", error);
    res.status(500).json({ message: "An error occurred" });
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

// revokes the caller's tokens (header or cookie) and clears the cookie; always succeeds
const logout = async (req, res) => {
  try {
    await authService.logout(readBearerToken(req) || req.cookies.token);
  } catch (error) {
    console.error("Error during logout:", error);
  }
  res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production" });
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
    });
  }
};

module.exports = { signup, login, logout, updatePassword };
