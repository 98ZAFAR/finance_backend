let createClient = null;

try {
  ({ createClient } = require("redis"));
} catch (error) {
  createClient = null;
}

let redisClient = null;

const initializeRedis = async () => {
  const redisUrl = process.env.REDIS_URL;

  if (!createClient) {
    console.log("Redis package is not installed. Caching is disabled.");
    return null;
  }

  if (!redisUrl) {
    console.log("Redis URL is not configured. Caching is disabled.");
    return null;
  }

  try {
    redisClient = createClient({ url: redisUrl });
    redisClient.on("error", (error) => {
      console.error("Redis error:", error.message);
    });

    await redisClient.connect();
    console.log("Redis connected");
    return redisClient;
  } catch (error) {
    redisClient = null;
    console.error("Redis connection failed. Caching is disabled:", error.message);
    return null;
  }
};

const getRedisClient = () => redisClient;

const isRedisReady = () => {
  return Boolean(redisClient && redisClient.isOpen);
};

module.exports = {
  initializeRedis,
  getRedisClient,
  isRedisReady,
};
