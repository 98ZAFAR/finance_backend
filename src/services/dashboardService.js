const {
  getSummaryMetrics,
  getCategoryAggregation,
  getMonthlyTrends,
  getRecentTransactions,
} = require("../repositories/dashboardRepository");
const { getRedisClient, isRedisReady } = require("../configs/redis");

const CACHE_TTL_SECONDS = Number(process.env.DASHBOARD_CACHE_TTL_SECONDS || 60);

const setCacheValue = async (client, key, payload) => {
  const serialized = JSON.stringify(payload);

  if (typeof client.setEx === "function") {
    await client.setEx(key, CACHE_TTL_SECONDS, serialized);
    return;
  }

  if (typeof client.setex === "function") {
    await client.setex(key, CACHE_TTL_SECONDS, serialized);
    return;
  }

  if (typeof client.set === "function") {
    // Upstash REST client uses set(key, value, { ex: seconds })
    await client.set(key, serialized, { ex: CACHE_TTL_SECONDS });
    return;
  }

  throw new Error("Redis client does not support cache set operation");
};

const deleteKeys = async (client, keys) => {
  if (keys.length === 0) {
    return;
  }

  if (typeof client.del !== "function") {
    return;
  }

  await client.del(...keys);
};

const withCache = async (key, producer) => {
  if (!isRedisReady()) {
    return producer();
  }

  try {
    const client = getRedisClient();
    const cached = await client.get(key);

    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (error) {
        // Fallback if cache has non-JSON content
        return cached;
      }
    }

    const payload = await producer();
    await setCacheValue(client, key, payload);
    return payload;
  } catch (error) {
    return producer();
  }
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

  try {
    const client = getRedisClient();
    const keys = await client.keys("dashboard:*");
    await deleteKeys(client, keys);
  } catch (error) {
    // Ignore cache invalidation failures to avoid blocking write operations.
  }
};

module.exports = {
  getDashboardSummary,
  getDashboardCategories,
  getDashboardTrends,
  getDashboardRecent,
  invalidateDashboardCache,
};
