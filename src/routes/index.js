const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const recordRoutes = require("./recordRoutes");
const dashboardRoutes = require("./dashboardRoutes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    message: "API is healthy",
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/records", recordRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
