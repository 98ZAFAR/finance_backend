const express = require("express");
const {
  loginController,
  registerController,
} = require("../controllers/auth/controller");
const { validatePayload } = require("../middlewares/validationMiddleware");
const {
  validateLoginPayload,
  validateRegistrationPayload,
} = require("../utils/validators");

const router = express.Router();

router.post("/login", validatePayload(validateLoginPayload), loginController);
router.post(
  "/register",
  validatePayload(validateRegistrationPayload),
  registerController,
);

module.exports = router;
