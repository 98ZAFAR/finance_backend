const express = require("express");
const {
  createRecordController,
  listRecordsController,
  getRecordController,
  updateRecordController,
  deleteRecordController,
} = require("../controllers/record/controller");
const { authenticate } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/rbacMiddleware");
const { validatePayload } = require("../middlewares/validationMiddleware");
const {
  validateRecordCreatePayload,
  validateRecordFilterQuery,
  validateIdParam,
  validateRecordUpdatePayload,
} = require("../utils/validators");

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  allowRoles("admin"),
  validatePayload(validateRecordCreatePayload),
  createRecordController,
);
router.get(
  "/",
  allowRoles("admin", "analyst"),
  validatePayload(validateRecordFilterQuery, "query"),
  listRecordsController,
);
router.get(
  "/:id",
  allowRoles("admin", "analyst"),
  validatePayload(validateIdParam, "params"),
  getRecordController,
);
router.patch(
  "/:id",
  allowRoles("admin"),
  validatePayload(validateIdParam, "params"),
  validatePayload(validateRecordUpdatePayload),
  updateRecordController,
);
router.delete(
  "/:id",
  allowRoles("admin"),
  validatePayload(validateIdParam, "params"),
  deleteRecordController,
);

module.exports = router;
