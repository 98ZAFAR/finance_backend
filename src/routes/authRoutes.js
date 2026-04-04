const express = require("express");
const {
  loginController,
  registerController,
  logoutController,
} = require("../controllers/auth/controller");
const { authenticateOptional } = require("../middlewares/authMiddleware");
const { validatePayload } = require("../middlewares/validationMiddleware");
const {
  validateLoginPayload,
  validateRegistrationPayload,
} = require("../utils/validators");

const router = express.Router();

router.post("/login", validatePayload(validateLoginPayload), loginController);
router.post(
  "/register",
  authenticateOptional,
  validatePayload(validateRegistrationPayload),
  registerController,
);
router.post("/logout", logoutController);

module.exports = router;
