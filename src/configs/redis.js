require("dotenv").config();
const { Redis } = require("@upstash/redis");
const { logger } = require("../utils/logger");

let redisClient = null;

const initializeRedis = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    logger.warn("Upstash credentials are missing. Caching is disabled", {
      hasUrl: Boolean(url),
      hasToken: Boolean(token),
    });
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });

    logger.info("Upstash Redis initialized", {
      provider: "upstash",
      mode: "rest",
    });
    return redisClient;
  } catch (error) {
    redisClient = null;
    logger.error("Redis initialization failed. Caching is disabled", {
      provider: "upstash",
      mode: "rest",
      error,
    });
    return null;
  }
};

const getRedisClient = () => redisClient;

const isRedisReady = () => {
  return Boolean(redisClient);
};

module.exports = {
  initializeRedis,
  getRedisClient,
  isRedisReady,
};