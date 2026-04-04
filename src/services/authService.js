const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  findUserByEmail,
  countUsers,
  createUser,
} = require("../repositories/userRepository");
const { ApiError } = require("../utils/errors");

const toSafeUser = (user) => {
  const plain = user.get({ plain: true });
  delete plain.password;
  return plain;
};

const createAuthToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    },
  );
};

const setAuthCookie = (res, token) => {
  const cookieName = process.env.AUTH_COOKIE_NAME || "auth_token";
  const maxAge = process.env.JWT_EXPIRES_IN
    ? parseInt(process.env.JWT_EXPIRES_IN) * 1000
    : 8 * 60 * 60 * 1000;
  const sameSite = process.env.AUTH_COOKIE_SAME_SITE || "lax";

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge,
    sameSite,
  });
};

const clearAuthCookie = (res) => {
  const cookieName = process.env.AUTH_COOKIE_NAME || "auth_token";
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.AUTH_COOKIE_SAME_SITE || "lax",
  });
};

const register = async (payload, actor = null) => {
  const existingUser = await findUserByEmail(payload.email);
  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const totalUsers = await countUsers();

  let role = payload.role || "viewer";
  let status = payload.status || "active";

  if (totalUsers === 0) {
    role = "admin";
    status = "active";
  } else if (!actor) {
    throw new ApiError(401, "Login required to register new users");
  } else if (actor.role !== "admin") {
    throw new ApiError(403, "Only admin users can register new users");
  }

  const user = await createUser({
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role,
    status,
  });

  return toSafeUser(user);
};

const login = async ({ email, password }) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "User account is inactive");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = createAuthToken(user);

  return {
    token,
    user: toSafeUser(user),
  };
};

const logout = async (res) => {
  clearAuthCookie(res);
};

module.exports = {
  register,
  login,
  logout,
  setAuthCookie,
  clearAuthCookie,
};
