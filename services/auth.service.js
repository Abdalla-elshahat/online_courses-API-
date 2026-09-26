const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const userRepository = require("../repositories/user.repository");
const fileService = require("./file.service");
const generateJWT = require("../utles/generate-jwt");
const { AppError } = require("../utles/app-error");
const { requireString } = require("../utles/validate");

// compared against when the email is unknown, so response time doesn't reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

const signToken = (user) =>
  generateJWT({ id: user._id, email: user.email, role: user.role, tv: user.tokenVersion || 0 });

const verifyJWT = (token) => jwt.verify(token, process.env.jwtsecret, { algorithms: ["HS256"] });

const requirePassword = (value, field = "Password") => {
  if (typeof value !== "string" || value.length < 8 || value.length > 72) {
    throw new AppError(400, { message: `${field} must be between 8 and 72 characters` });
  }
  return value;
};

// validates a token against the database: the user must still exist and the token must not be revoked.
// Role comes from the database, so role changes apply immediately.
const resolveSession = async (token) => {
  const decoded = verifyJWT(token);
  const user = await userRepository.findById(decoded.id, { role: 1, email: 1, tokenVersion: 1 });
  if (!user || (user.tokenVersion || 0) !== (decoded.tv || 0)) {
    throw new AppError(401, { message: "Invalid token." });
  }
  return { id: String(user._id), email: user.email, role: user.role };
};

const signup = async ({ username, email, password, jop, job, socialmedia }, avatarFile) => {
  const cleanName = requireString(username, "Username", { min: 2, max: 50 });
  if (typeof email !== "string" || !validator.isEmail(email)) {
    throw new AppError(400, { message: "A valid email is required" });
  }
  requirePassword(password);

  const normalizedEmail = email.trim().toLowerCase();
  if (await userRepository.findByEmail(normalizedEmail)) {
    throw new AppError(400, { message: "Email already exists" });
  }

  const avatar = avatarFile
    ? await fileService.saveImage(avatarFile, "avatar")
    : fileService.DEFAULT_IMAGE;

  // role is never taken from the request: everyone signs up as a regular user
  const newUser = await userRepository.create({
    username: cleanName,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
    avatar,
    job: typeof (job ?? jop) === "string" ? job ?? jop : undefined,
    socialmedia: typeof socialmedia === "string" ? socialmedia : undefined,
  });

  return {
    id: newUser._id,
    username: newUser.username,
    email: newUser.email,
    token: signToken(newUser),
    role: newUser.role,
    avatar: newUser.avatar,
    jop: newUser.job,
    socialmedia: newUser.socialmedia,
  };
};

// returns a fresh token; throws if the cookie token is still valid or credentials are wrong
const login = async ({ email, password }, existingToken) => {
  if (existingToken) {
    try {
      await resolveSession(existingToken);
      throw new AppError(400, { message: "You are already logged in", token: existingToken });
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 400) throw err;
      // stale cookie: continue with a normal login
    }
  }

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    throw new AppError(401, { message: "Invalid email or password" });
  }
  const user = await userRepository.findByEmail(email.trim().toLowerCase());
  const passwordOk = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !passwordOk) {
    throw new AppError(401, { message: "Invalid email or password" });
  }

  return signToken(user);
};

// revokes every token issued to this user (used by logout)
const revokeTokens = (userId) => userRepository.updateById(userId, { $inc: { tokenVersion: 1 } });

// logs out the user owning `token` if it is valid; invalid tokens are ignored
const logout = async (token) => {
  if (!token) return;
  try {
    const session = await resolveSession(token);
    await revokeTokens(session.id);
  } catch {
    // already invalid: nothing to revoke
  }
};

const updatePassword = async (userId, { old_pass, new_pass, confirm_pass }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(404, { message: "User not found" });
  }
  if (typeof old_pass !== "string" || !(await bcrypt.compare(old_pass, user.password))) {
    throw new AppError(401, { message: "The old password is incorrect" });
  }
  if (new_pass !== confirm_pass) {
    throw new AppError(400, {
      message: "The new password and confirmation password do not match",
    });
  }
  requirePassword(new_pass, "New password");

  // changing the password also signs out every other session
  const updatedUser = await userRepository.updateById(
    userId,
    { $set: { password: await bcrypt.hash(new_pass, 10) }, $inc: { tokenVersion: 1 } },
    { runValidators: true }
  );
  if (!updatedUser) {
    throw new AppError(404, { status: 404, message: "User not found" });
  }
  return { id: updatedUser._id, username: updatedUser.username, email: updatedUser.email };
};

module.exports = { resolveSession, signup, login, logout, updatePassword };
