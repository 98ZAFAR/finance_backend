const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/errors");
const { findActiveUserById } = require("../repositories/userRepository");

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "auth_token";

const extractToken = (req) => {
  const cookieToken = req.cookies && req.cookies[AUTH_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
};

const attachUserFromToken = async (req, token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await findActiveUserById(decoded.userId);
  if (!user) {
    throw new ApiError(401, "Invalid or expired token");
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    name: user.name,
  };
};

const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next(new ApiError(401, "Missing authentication token"));
    }

    await attachUserFromToken(req, token);

    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

const authenticateOptional = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    await attachUserFromToken(req, token);

    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

module.exports = {
  authenticate,
  authenticateOptional,
};
