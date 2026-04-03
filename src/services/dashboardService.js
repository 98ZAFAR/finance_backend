const {
  getSummaryMetrics,
  getCategoryAggregation,
  getMonthlyTrends,
  getRecentTransactions,
} = require("../repositories/dashboardRepository");
const { getRedisClient, isRedisReady } = require("../configs/redis");

const CACHE_TTL_SECONDS = Number(process.env.DASHBOARD_CACHE_TTL_SECONDS || 60);

const withCache = async (key, producer) => {
  if (!isRedisReady()) {
    return producer();
  }

  const client = getRedisClient();
  const cached = await client.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const payload = await producer();
  await client.setEx(key, CACHE_TTL_SECONDS, JSON.stringify(payload));
  return payload;
};

const getDashboardSummary = async () => {
  return withCache("dashboard:summary", () => getSummaryMetrics());
};

const getDashboardCategories = async () => {
  return withCache("dashboard:categories", () => getCategoryAggregation());
};

const getDashboardTrends = async () => {
  return withCache("dashboard:trends", () => getMonthlyTrends());
};

const getDashboardRecent = async (limit) => {
  return withCache(`dashboard:recent:${limit}`, async () => {
    const records = await getRecentTransactions(limit);
    return records.map((record) => {
      const plain = record.get({ plain: true });
      return {
        ...plain,
        amount: Number(plain.amount),
      };
    });
  });
};

const invalidateDashboardCache = async () => {
  if (!isRedisReady()) {
    return;
  }

  const client = getRedisClient();
  const keys = await client.keys("dashboard:*");

  if (keys.length > 0) {
    await client.del(keys);
  }
};

module.exports = {
  getDashboardSummary,
  getDashboardCategories,
  getDashboardTrends,
  getDashboardRecent,
  invalidateDashboardCache,
};
