require("dotenv").config();
const { Redis } = require("@upstash/redis");

let redisClient = null;

const initializeRedis = () => {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
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