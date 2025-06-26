class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Set error message
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Mark as expected error

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;