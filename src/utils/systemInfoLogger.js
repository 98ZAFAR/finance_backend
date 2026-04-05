const os = require("os");
const { logger } = require("./logger");

const toMegabytes = (bytes) => {
  return Number((bytes / (1024 * 1024)).toFixed(2));
};

const collectSystemInfo = (reason) => {
  const memory = process.memoryUsage();

  return {
    reason,
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    hostname: os.hostname(),
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    cpuCount: os.cpus().length,
    loadAverage: os.loadavg().map((value) => Number(value.toFixed(2))),
    processMemoryMb: {
      rss: toMegabytes(memory.rss),
      heapTotal: toMegabytes(memory.heapTotal),
      heapUsed: toMegabytes(memory.heapUsed),
      external: toMegabytes(memory.external),
      arrayBuffers: toMegabytes(memory.arrayBuffers || 0),
    },
    systemMemoryMb: {
      total: toMegabytes(os.totalmem()),
      free: toMegabytes(os.freemem()),
    },
  };
};

const logSystemInfo = (reason = "interval") => {
  logger.info("System information snapshot", collectSystemInfo(reason));
};

const startSystemInfoLogger = () => {
  const rawIntervalMs = process.env.SYSTEM_INFO_LOG_INTERVAL_MS;
  const intervalMs = Number(rawIntervalMs || 300000);

  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    logger.warn("System information logger is disabled", {
      configuredInterval: rawIntervalMs || null,
    });
    return null;
  }

  logSystemInfo("startup");

  const timer = setInterval(() => {
    logSystemInfo("interval");
  }, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  logger.info("System information logger started", { intervalMs });
  return timer;
};

module.exports = {
  startSystemInfoLogger,
  logSystemInfo,
};
