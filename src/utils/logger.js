const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

const LOG_LABELS = {
  error: "ERROR",
  warn: "WARN",
  info: "INFO",
  debug: "DEBUG",
  trace: "TRACE",
};

const ANSI_RESET = "\u001b[0m";
const ANSI_COLORS = {
  gray: "\u001b[90m",
  blue: "\u001b[34m",
  cyan: "\u001b[36m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  red: "\u001b[31m",
  magenta: "\u001b[35m",
};

const LEVEL_COLORS = {
  trace: ANSI_COLORS.gray,
  debug: ANSI_COLORS.cyan,
  info: ANSI_COLORS.green,
  warn: ANSI_COLORS.yellow,
  error: ANSI_COLORS.red,
};

const DEFAULT_LOGGER_NAME = process.env.LOGGER_NAME || "zorvyn.backend";

const parseBooleanEnv = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return null;
};

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /cookie/i,
  /api[_-]?key/i,
];

const isSensitiveKey = (key) => {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
};

const sanitizeValue = (value, depth = 0) => {
  if (depth > 4) {
    return "[DepthLimit]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Error) {
    return serializeError(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const output = {};

    for (const [key, childValue] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
        output[key] = "[REDACTED]";
      } else {
        output[key] = sanitizeValue(childValue, depth + 1);
      }
    }

    return output;
  }

  return value;
};

const normalizeLogLevel = (level) => {
  if (!level || typeof level !== "string") {
    return null;
  }

  const normalized = level.toLowerCase();
  return Object.prototype.hasOwnProperty.call(LOG_LEVELS, normalized)
    ? normalized
    : null;
};

const resolveCurrentLogLevel = () => {
  const envLevel = normalizeLogLevel(process.env.LOG_LEVEL);
  if (envLevel) {
    return envLevel;
  }

  return process.env.NODE_ENV === "production" ? "info" : "debug";
};

const shouldLog = (level) => {
  const currentLevel = resolveCurrentLogLevel();
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
};

const serializeError = (error) => {
  if (!error || typeof error !== "object") {
    return {
      message: String(error),
    };
  }

  const payload = {
    name: error.name || "Error",
    message: error.message || "Unknown error",
  };

  if (error.statusCode) {
    payload.statusCode = error.statusCode;
  }

  if (error.details) {
    payload.details = sanitizeValue(error.details);
  }

  if (process.env.NODE_ENV !== "production" && error.stack) {
    payload.stack = error.stack;
  }

  return payload;
};

const stringifyMetaValue = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return String(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
};

const formatMetaDetails = (meta = {}) => {
  const entries = Object.entries(meta);

  if (entries.length === 0) {
    return "";
  }

  return entries
    .map(([key, value]) => `${key}=${stringifyMetaValue(value)}`)
    .join(" ");
};

const padNumber = (value, size = 2) => {
  return String(value).padStart(size, "0");
};

const formatTimestamp = (date) => {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())} ${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}.${padNumber(date.getMilliseconds(), 3)}`;
};

const resolveThreadLabel = (meta) => {
  if (typeof meta.thread === "string" && meta.thread.trim()) {
    return meta.thread.trim();
  }

  if (typeof meta.requestId === "string" && meta.requestId.trim()) {
    return `req-${meta.requestId.trim().slice(0, 8)}`;
  }

  return "main";
};

const resolveLoggerName = (meta) => {
  if (typeof meta.logger === "string" && meta.logger.trim()) {
    return meta.logger.trim();
  }

  return DEFAULT_LOGGER_NAME;
};

const splitPresentationMeta = (meta = {}) => {
  const cloned = { ...meta };
  const loggerName = resolveLoggerName(cloned);
  const thread = resolveThreadLabel(cloned);

  delete cloned.logger;
  delete cloned.thread;

  return {
    loggerName,
    thread,
    details: cloned,
  };
};

const isColorEnabled = () => {
  const forcedByEnv = parseBooleanEnv(process.env.LOG_COLORS);
  if (forcedByEnv !== null) {
    return forcedByEnv;
  }

  if (Object.prototype.hasOwnProperty.call(process.env, "NO_COLOR")) {
    return false;
  }

  return Boolean(process.stdout && process.stdout.isTTY);
};

const colorize = (text, colorCode, enabled) => {
  if (!enabled || !colorCode) {
    return text;
  }

  return `${colorCode}${text}${ANSI_RESET}`;
};

const writeLog = (level, message, meta = {}) => {
  if (!shouldLog(level)) {
    return;
  }

  const timestamp = formatTimestamp(new Date());
  const safeMeta = sanitizeValue(meta);
  const { loggerName, thread, details } = splitPresentationMeta(safeMeta);
  const detailsText = formatMetaDetails(details);
  const colorsEnabled = isColorEnabled();
  const levelToken = colorize(`[${LOG_LABELS[level]}]`, LEVEL_COLORS[level], colorsEnabled);
  const timestampToken = colorize(timestamp, ANSI_COLORS.gray, colorsEnabled);
  const loggerToken = colorize(loggerName, ANSI_COLORS.magenta, colorsEnabled);
  const threadToken = colorize(`[${thread}]`, ANSI_COLORS.blue, colorsEnabled);
  const line = `${levelToken} ${timestampToken} ${loggerToken} ${threadToken} ${message}${detailsText ? ` ${detailsText}` : ""}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

const logger = {
  trace: (message, meta) => writeLog("trace", message, meta),
  debug: (message, meta) => writeLog("debug", message, meta),
  info: (message, meta) => writeLog("info", message, meta),
  warn: (message, meta) => writeLog("warn", message, meta),
  error: (message, meta) => writeLog("error", message, meta),
};

module.exports = {
  logger,
  serializeError,
};
