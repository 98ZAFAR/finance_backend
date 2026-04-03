const express = require("express");
const {
  createUserController,
  listUsersController,
  getUserController,
  updateUserController,
  updateUserStatusController,
  deleteUserController,
} = require("../controllers/user/controller");
const { authenticate } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/rbacMiddleware");
const { validatePayload } = require("../middlewares/validationMiddleware");
const {
  validateRegistrationPayload,
  validateUserListQuery,
  validateIdParam,
  validateUserUpdatePayload,
  validateStatusPayload,
} = require("../utils/validators");

const router = express.Router();

router.use(authenticate);
router.use(allowRoles("admin"));

router.post("/", validatePayload(validateRegistrationPayload), createUserController);
router.get("/", validatePayload(validateUserListQuery, "query"), listUsersController);
router.get("/:id", validatePayload(validateIdParam, "params"), getUserController);
router.patch(
  "/:id",
  validatePayload(validateIdParam, "params"),
  validatePayload(validateUserUpdatePayload),
  updateUserController,
);
router.patch(
  "/:id/status",
  validatePayload(validateIdParam, "params"),
  validatePayload(validateStatusPayload),
  updateUserStatusController,
);
router.delete("/:id", validatePayload(validateIdParam, "params"), deleteUserController);

module.exports = router;
