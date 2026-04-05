const crypto = require("crypto");
const { logger } = require("../utils/logger");

const getRequestId = (req) => {
  const incomingRequestId = req.headers["x-request-id"];
  if (typeof incomingRequestId === "string" && incomingRequestId.trim()) {
    return incomingRequestId.trim();
  }

  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const resolveRoutePath = (req) => {
  if (!req.route) {
    return req.originalUrl || req.url;
  }

  const routePath = typeof req.route.path === "string" ? req.route.path : req.path;
  return `${req.baseUrl || ""}${routePath}`;
};

const resolveApiArea = (path) => {
  if (!path || typeof path !== "string") {
    return "unknown";
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length < 2) {
    return segments[0] || "root";
  }

  return segments[1];
};

const toDurationMs = (startTimeNs) => {
  const elapsedNs = process.hrtime.bigint() - startTimeNs;
  return Number(elapsedNs) / 1_000_000;
};

const requestLogger = (req, res, next) => {
  const requestId = getRequestId(req);
  const startTimeNs = process.hrtime.bigint();
  let completed = false;

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  logger.debug("HTTP request started", {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    queryKeys: Object.keys(req.query || {}),
  });

  const emitLog = (eventType) => {
    if (completed) {
      return;
    }

    completed = true;

    const routePath = resolveRoutePath(req);
    const durationMs = Number(toDurationMs(startTimeNs).toFixed(2));
    const statusCode = res.statusCode;

    const baseMeta = {
      eventType,
      requestId,
      method: req.method,
      path: req.originalUrl,
      route: routePath,
      apiArea: resolveApiArea(routePath),
      statusCode,
      durationMs,
      contentLength: res.getHeader("content-length") || null,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      userId: req.user ? req.user.id : null,
      userRole: req.user ? req.user.role : null,
    };

    if (statusCode >= 500) {
      logger.error("HTTP request completed with server error", baseMeta);
      return;
    }

    if (statusCode >= 400) {
      logger.warn("HTTP request completed with client error", baseMeta);
      return;
    }

    logger.info("HTTP request completed", baseMeta);
  };

  res.on("finish", () => emitLog("finish"));
  res.on("close", () => emitLog("close"));

  return next();
};

module.exports = {
  requestLogger,
};
