const {
  register,
  login,
  setAuthCookie,
  logout,
} = require("../../services/authService");
const { asyncHandler } = require("../../utils/asyncHandler");

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "auth_token";
const AUTH_COOKIE_MAX_AGE_MS =
  Number(process.env.AUTH_COOKIE_MAX_AGE_MS) || 8 * 60 * 60 * 1000;
const AUTH_COOKIE_SAME_SITE = process.env.AUTH_COOKIE_SAME_SITE || "lax";

const registerController = asyncHandler(async (req, res) => {
  const user = await register(req.body, req.user || null);
  res.status(201).json({
    message: "User registered successfully",
    data: user,
  });
});

const loginController = asyncHandler(async (req, res) => {
  const payload = await login(req.body);
  setAuthCookie(res, payload.token);
  res.status(200).json({
    message: "Login successful",
    data: payload,
  });
});

const logoutController = asyncHandler(async (req, res) => {
  await logout(res);
  res.status(200).json({
    message: "Logout successful",
  });
});

module.exports = {
  registerController,
  loginController,
  logoutController,
};
