const jwt = require('jsonwebtoken');

module.exports = function generateToken(payload) {
  if (!process.env.jwtsecret) {
    throw new Error("Environment variable JWT_SECRET is not defined");
  }

  return jwt.sign(payload, process.env.jwtsecret, { expiresIn: "100min" });
};
