require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { connectDB } = require("./configs/db");
const { initializeRedis } = require("./configs/redis");
const { sequelize } = require("./models");
const routes = require("./routes");
const { requestLogger } = require("./middlewares/requestLoggerMiddleware");
const { logger } = require("./utils/logger");
const { startSystemInfoLogger } = require("./utils/systemInfoLogger");
const {
  notFoundHandler,
  errorHandler,
} = require("./middlewares/errorMiddleware");

const app = express();
const port = process.env.PORT || 3000;

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

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    logger.info("Server startup initialized", {
      port,
      environment: process.env.NODE_ENV || "development",
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