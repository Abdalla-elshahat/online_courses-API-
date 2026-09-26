const { rateLimit } = require("express-rate-limit");

// slows down password guessing / credential stuffing on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again in 15 minutes" },
});

// general safety net for the whole API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, please slow down" },
});

module.exports = { authLimiter, apiLimiter };
