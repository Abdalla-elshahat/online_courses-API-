const jwt = require("jsonwebtoken");

module.exports = function generateToken(payload) {
  if (!process.env.jwtsecret) {
    throw new Error("Environment variable jwtsecret is not defined");
  }

  return jwt.sign(payload, process.env.jwtsecret, {
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};
