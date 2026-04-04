require("dotenv").config();
const { Redis } = require("@upstash/redis");

let redisClient = null;

const initializeRedis = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    console.log("Upstash credentials are missing. Caching is disabled.");
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });

    console.log("Upstash Redis initialized (REST mode)");
    return redisClient;
  } catch (error) {
    redisClient = null;
    console.error(
      "Redis initialization failed. Caching is disabled:",
      error.message
    );
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