require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { connectDB } = require("./configs/db");
const { initializeRedis } = require("./configs/redis");
const { sequelize } = require("./models");
const routes = require("./routes");
const { requestLogger } = require("./middlewares/requestLoggerMiddleware");
const { createRedisRateLimiter } = require("./middlewares/rateLimitMiddleware");
const { logger } = require("./utils/logger");
const { startSystemInfoLogger } = require("./utils/systemInfoLogger");
const {
  notFoundHandler,
  errorHandler,
} = require("./middlewares/errorMiddleware");

const app = express();
const port = process.env.PORT || 3000;

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const RATE_LIMIT_FAIL_OPEN = process.env.RATE_LIMIT_FAIL_OPEN !== "false";
const API_RATE_LIMIT_WINDOW_SECONDS = parsePositiveInteger(
  process.env.RATE_LIMIT_WINDOW_SECONDS,
  60,
);
const API_RATE_LIMIT_MAX_REQUESTS = parsePositiveInteger(
  process.env.RATE_LIMIT_MAX_REQUESTS,
  120,
);
const AUTH_RATE_LIMIT_WINDOW_SECONDS = parsePositiveInteger(
  process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS,
  60,
);
const AUTH_RATE_LIMIT_MAX_REQUESTS = parsePositiveInteger(
  process.env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  10,
);

const authRateLimiter = createRedisRateLimiter({
  name: "auth",
  prefix: "auth",
  windowSeconds: AUTH_RATE_LIMIT_WINDOW_SECONDS,
  maxRequests: AUTH_RATE_LIMIT_MAX_REQUESTS,
  failOpen: RATE_LIMIT_FAIL_OPEN,
});

const apiRateLimiter = createRedisRateLimiter({
  name: "api",
  prefix: "api",
  windowSeconds: API_RATE_LIMIT_WINDOW_SECONDS,
  maxRequests: API_RATE_LIMIT_MAX_REQUESTS,
  failOpen: RATE_LIMIT_FAIL_OPEN,
  skip: (req) => req.path.startsWith("/auth"),
});

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: "GET,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Finance backend is running",
  });
});

app.use("/api/auth", authRateLimiter);
app.use("/api", apiRateLimiter, routes);
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    logger.info("Server startup initialized", {
      port,
      environment: process.env.NODE_ENV || "development",
      rateLimit: {
        failOpen: RATE_LIMIT_FAIL_OPEN,
        api: {
          windowSeconds: API_RATE_LIMIT_WINDOW_SECONDS,
          maxRequests: API_RATE_LIMIT_MAX_REQUESTS,
        },
        auth: {
          windowSeconds: AUTH_RATE_LIMIT_WINDOW_SECONDS,
          maxRequests: AUTH_RATE_LIMIT_MAX_REQUESTS,
        },
      },
    });

    await connectDB();
    await sequelize.sync();
    logger.info("Models synchronized");

    await initializeRedis();
    startSystemInfoLogger();

    app.listen(port, () => {
      logger.info("Server is listening", {
        port,
        baseApiPath: "/api",
      });
    });
  }
  catch (error) {
    logger.error("Failed to start server", {
      error,
    });
    process.exit(1);
  }
};

startServer();