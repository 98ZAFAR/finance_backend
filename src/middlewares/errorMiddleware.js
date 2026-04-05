const { ApiError } = require("../utils/errors");
const { logger, serializeError } = require("../utils/logger");

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    logger.error("Unhandled API error", {
      requestId: req.requestId || null,
      method: req.method,
      path: req.originalUrl,
      route: req.route ? `${req.baseUrl || ""}${req.route.path}` : req.originalUrl,
      statusCode,
      userId: req.user ? req.user.id : null,
      userRole: req.user ? req.user.role : null,
      error: serializeError(error),
    });
  } else {
    logger.warn("Handled API error", {
      requestId: req.requestId || null,
      method: req.method,
      path: req.originalUrl,
      route: req.route ? `${req.baseUrl || ""}${req.route.path}` : req.originalUrl,
      statusCode,
      userId: req.user ? req.user.id : null,
      userRole: req.user ? req.user.role : null,
      error: serializeError(error),
    });
  }

  const payload = {
    message: error.message || "Internal server error",
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && statusCode >= 500) {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
