function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Route not found",
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    err.statusCode || 500;

  if (statusCode === 503) {
    return res.status(503).json({
      error:
        "External data source unavailable",
      details:
        err.details || err.message,
    });
  }

  res.status(statusCode).json({
    error:
      statusCode === 500
        ? "Internal server error"
        : err.message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};