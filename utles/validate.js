const mongoose = require("mongoose");
const { AppError } = require("./app-error");

const isObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value) && /^[a-f0-9]{24}$/i.test(value);

// throws a 400 unless `value` is a valid ObjectId string
const requireObjectId = (value, field = "id") => {
  if (!isObjectId(value)) {
    throw new AppError(400, { message: `Invalid ${field}` });
  }
  return value;
};

// throws a 400 unless `value` is a string within the length bounds
const requireString = (value, field, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string" || value.trim().length < min || value.length > max) {
    throw new AppError(400, { message: `${field} must be between ${min} and ${max} characters` });
  }
  return value.trim();
};

// makes user input safe to use inside a RegExp
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isAdmin = (actor) => actor?.role === "admin";

module.exports = { isObjectId, requireObjectId, requireString, escapeRegex, isAdmin };
