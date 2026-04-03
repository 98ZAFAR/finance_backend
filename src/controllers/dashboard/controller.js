const {
  getDashboardSummary,
  getDashboardCategories,
  getDashboardTrends,
  getDashboardRecent,
} = require("../../services/dashboardService");
const { asyncHandler } = require("../../utils/asyncHandler");

const getSummaryController = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummary();
  res.status(200).json({
    message: "Dashboard summary fetched successfully",
    data: summary,
  });
});

const getCategoriesController = asyncHandler(async (req, res) => {
  const categories = await getDashboardCategories();
  res.status(200).json({
    message: "Category aggregation fetched successfully",
    data: categories,
  });
});

const getTrendsController = asyncHandler(async (req, res) => {
  const trends = await getDashboardTrends();
  res.status(200).json({
    message: "Monthly trends fetched successfully",
    data: trends,
  });
});

const getRecentController = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit || 10);
  const records = await getDashboardRecent(limit);

  res.status(200).json({
    message: "Recent transactions fetched successfully",
    data: records,
  });
});

module.exports = {
  getSummaryController,
  getCategoriesController,
  getTrendsController,
  getRecentController,
};
