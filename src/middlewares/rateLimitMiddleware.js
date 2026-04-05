const { getRedisClient, isRedisReady } = require("../configs/redis");
const { ApiError } = require("../utils/errors");
const { logger } = require("../utils/logger");

const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_MAX_REQUESTS = 120;
const REDIS_WARNING_COOLDOWN_MS = 60 * 1000;

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const toUnixSeconds = (milliseconds) => {
  return Math.floor(milliseconds / 1000);
};

const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
};

const defaultKeyGenerator = (req) => {
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }

  return `ip:${getClientIp(req)}`;
};

const setRateLimitHeaders = (res, payload) => {
  res.setHeader("X-RateLimit-Limit", payload.limit);
  res.setHeader("X-RateLimit-Remaining", payload.remaining);
  res.setHeader("X-RateLimit-Reset", payload.resetAtSeconds);
};

const incrementCounter = async (client, key) => {
  if (typeof client.incr === "function") {
    return client.incr(key);
  }

  if (typeof client.incrby === "function") {
    return client.incrby(key, 1);
  }

  throw new Error("Redis client does not support INCR operation");
};

const setCounterExpiry = async (client, key, windowSeconds) => {
  if (typeof client.expire === "function") {
    await client.expire(key, windowSeconds);
  }
};

const createRedisRateLimiter = (options = {}) => {
  const {
    name = "api",
    prefix = name,
    windowSeconds: rawWindowSeconds = DEFAULT_WINDOW_SECONDS,
    maxRequests: rawMaxRequests = DEFAULT_MAX_REQUESTS,
    keyGenerator = defaultKeyGenerator,
    skip = null,
    failOpen: rawFailOpen,
  } = options;

  const windowSeconds = parsePositiveInteger(rawWindowSeconds, DEFAULT_WINDOW_SECONDS);
  const maxRequests = parsePositiveInteger(rawMaxRequests, DEFAULT_MAX_REQUESTS);
  const failOpen =
    typeof rawFailOpen === "boolean"
      ? rawFailOpen
      : process.env.RATE_LIMIT_FAIL_OPEN !== "false";

  let lastRedisWarningAt = 0;

  return async (req, res, next) => {
    if (typeof skip === "function" && skip(req)) {
      return next();
    }

    if (!isRedisReady()) {
      const now = Date.now();
      if (now - lastRedisWarningAt > REDIS_WARNING_COOLDOWN_MS) {
        lastRedisWarningAt = now;
        logger.warn("Redis is unavailable. Rate limiter skipped", {
          logger: "rate-limiter",
          limiter: name,
          failOpen,
        });
      }

      if (failOpen) {
        return next();
      }

      return next(new ApiError(503, "Service temporarily unavailable"));
    }

    try {
      const nowMs = Date.now();
      const windowMs = windowSeconds * 1000;
      const bucket = Math.floor(nowMs / windowMs);
      const resetAtMs = (bucket + 1) * windowMs;
      const resetAtSeconds = toUnixSeconds(resetAtMs);

      const identifierSource = keyGenerator(req) || "anonymous";
      const identifier = String(identifierSource).trim() || "anonymous";
      const key = `rate_limit:${prefix}:${identifier}:${bucket}`;

      const client = getRedisClient();
      const countRaw = await incrementCounter(client, key);
      const count = Number(countRaw);

      if (!Number.isFinite(count)) {
        throw new Error(`Invalid rate limit counter value: ${countRaw}`);
      }

      if (count === 1) {
        // Add a few extra seconds to account for network jitter.
        await setCounterExpiry(client, key, windowSeconds + 5);
      }

      const remaining = Math.max(maxRequests - count, 0);
      setRateLimitHeaders(res, {
        limit: maxRequests,
        remaining,
        resetAtSeconds,
      });

      if (count > maxRequests) {
        const retryAfterSeconds = Math.max(resetAtSeconds - toUnixSeconds(nowMs), 1);
        res.setHeader("Retry-After", retryAfterSeconds);

        logger.warn("Rate limit exceeded", {
          logger: "rate-limiter",
          limiter: name,
          requestId: req.requestId || null,
          method: req.method,
          path: req.originalUrl,
          identifier,
          count,
          maxRequests,
          retryAfterSeconds,
        });

        return next(new ApiError(429, "Too many requests. Please try again later."));
      }

      return next();
    } catch (error) {
      logger.error("Redis rate limiter error", {
        logger: "rate-limiter",
        limiter: name,
        requestId: req.requestId || null,
        method: req.method,
        path: req.originalUrl,
        error,
      });

      if (failOpen) {
        return next();
      }

      return next(new ApiError(503, "Service temporarily unavailable"));
    }
  };
};

module.exports = {
  createRedisRateLimiter,
  getClientIp,
};
