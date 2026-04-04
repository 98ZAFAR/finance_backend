require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { connectDB } = require("./configs/db");
const { initializeRedis } = require("./configs/redis");
const { sequelize } = require("./models");
const routes = require("./routes");
const {
  notFoundHandler,
  errorHandler,
} = require("./middlewares/errorMiddleware");

const app = express();
const port = process.env.PORT || 3000;

corsOptions = {
  origin: process.env.CORS_ORIGIN || "*",
  methods: "GET,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
    await connectDB();
    await sequelize.sync();
    console.log("Models synchronized");
    await initializeRedis();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
  catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();