const { ApiError } = require("../utils/errors");

const validatePayload = (validator, source = "body") => {
  return (req, res, next) => {
    const payload = req[source] || {};
    const errors = validator(payload);

    if (errors.length > 0) {
      return next(new ApiError(400, "Validation failed", errors));
    }

    return next();
  };
};

module.exports = {
  validatePayload,
};
