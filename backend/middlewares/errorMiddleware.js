const errorHandler = (err, req, res, next) => {
  console.error("Error 💥:", err.stack);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // For unexpected programming errors
  if (!err.isOperational) {
    message = "Something went wrong!";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;