const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/errors");
const { findActiveUserById } = require("../repositories/userRepository");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Missing or invalid authorization header"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await findActiveUserById(decoded.userId);
    if (!user) {
      return next(new ApiError(401, "Invalid or expired token"));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      name: user.name,
    };

    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

module.exports = {
  authenticate,
};
