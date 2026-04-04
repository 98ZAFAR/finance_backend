const express = require("express");
const {
  getSummaryController,
  getCategoriesController,
  getTrendsController,
  getRecentController,
} = require("../controllers/dashboard/controller");
const { authenticate } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/rbacMiddleware");
const { validatePayload } = require("../middlewares/validationMiddleware");
const { validateRecentQuery } = require("../utils/validators");

const router = express.Router();

router.use(authenticate);
router.use(allowRoles("admin", "analyst", "viewer"));

router.get("/summary", getSummaryController);
router.get("/categories", getCategoriesController);
router.get("/trends", getTrendsController);
router.get(
  "/recent",
  validatePayload(validateRecentQuery, "query"),
  getRecentController,
);

module.exports = router;
