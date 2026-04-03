const { register, login } = require("../../services/authService");
const { asyncHandler } = require("../../utils/asyncHandler");

const registerController = asyncHandler(async (req, res) => {
	const user = await register(req.body, req.user || null);
	res.status(201).json({
		message: "User registered successfully",
		data: user,
	});
});

const loginController = asyncHandler(async (req, res) => {
	const payload = await login(req.body);
	res.status(200).json({
		message: "Login successful",
		data: payload,
	});
});

module.exports = {
	registerController,
	loginController,
};
