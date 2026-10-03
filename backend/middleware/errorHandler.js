const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  const statusCode = err.statusCode || 500;

  const message =
    statusCode >= 500
      ? "Internal server error"
      : err.message || "Request failed";

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;