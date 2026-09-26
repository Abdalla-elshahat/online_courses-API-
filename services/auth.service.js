const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/user.repository");
const generateJWT = require("../utles/generate-jwt");
const { AppError } = require("../utles/app-error");

const DEFAULT_AVATAR = "no-photo-available-icon-20.jpg";

const isValidToken = (token) => {
  try {
    return Boolean(jwt.verify(token, process.env.jwtsecret));
  } catch {
    return false;
  }
};

const signup = async ({ username, email, password, role, jop, socialmedia }, avatarFile) => {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new AppError(400, { message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await userRepository.create({
    username,
    email,
    password: hashedPassword,
    role,
    avatar: avatarFile || DEFAULT_AVATAR,
    jop,
    socialmedia,
  });

  const token = generateJWT({ email: newUser.email, id: newUser._id, role: newUser.role });
  return {
    id: newUser._id,
    username: newUser.username,
    email: newUser.email,
    token,
    role: newUser.role,
    avatar: newUser.avatar,
    jop: newUser.jop,
    socialmedia: newUser.socialmedia,
  };
};

// returns a fresh token; throws if the cookie token is still valid or credentials are wrong
const login = async ({ email, password }, existingToken) => {
  if (existingToken && isValidToken(existingToken)) {
    throw new AppError(400, { message: "You are already logged in", token: existingToken });
  }

  if (!email || !password) {
    throw new AppError(401, { message: "Invalid email or password" });
  }
  const user = await userRepository.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(401, { message: "Invalid email or password" });
  }

  return generateJWT({ id: user._id, email: user.email, role: user.role });
};

const updatePassword = async (userId, { old_pass, new_pass, confirm_pass }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(404, { message: "User not found" });
  }
  if (!(await bcrypt.compare(old_pass, user.password))) {
    throw new AppError(401, { message: "The old password is incorrect" });
  }
  if (new_pass !== confirm_pass) {
    throw new AppError(400, {
      message: "The new password and confirmation password do not match",
    });
  }

  const hashedPassword = await bcrypt.hash(new_pass, 10);
  const updatedUser = await userRepository.updateById(
    userId,
    { $set: { password: hashedPassword } },
    { new: true, runValidators: true }
  );
  if (!updatedUser) {
    throw new AppError(404, { status: 404, message: "User not found" });
  }
  return { id: updatedUser._id, username: updatedUser.username, email: updatedUser.email };
};

module.exports = { signup, login, updatePassword };
