const { register, login } = require("../../services/authService");
const { asyncHandler } = require("../../utils/asyncHandler");

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "auth_token";
const AUTH_COOKIE_MAX_AGE_MS = Number(process.env.AUTH_COOKIE_MAX_AGE_MS) || 8 * 60 * 60 * 1000;
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
	res.cookie(AUTH_COOKIE_NAME, payload.token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: AUTH_COOKIE_SAME_SITE,
		maxAge: AUTH_COOKIE_MAX_AGE_MS,
	});
	res.status(200).json({
		message: "Login successful",
		data: payload,
	});
});

module.exports = {
	registerController,
	loginController,
};
