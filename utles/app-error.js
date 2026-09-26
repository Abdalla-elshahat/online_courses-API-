// Error thrown by services: carries the exact HTTP status and JSON body
// the controller should send back.
class AppError extends Error {
  constructor(statusCode, body) {
    super((body && body.message) || "Error");
    this.statusCode = statusCode;
    this.body = body;
  }
}

// Sends the error if it is an AppError; returns true when a response was sent.
const sendIfAppError = (res, error) => {
  if (!(error instanceof AppError)) return false;
  res.status(error.statusCode).json(error.body);
  return true;
};

module.exports = { AppError, sendIfAppError };
