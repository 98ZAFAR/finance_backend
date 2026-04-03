require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});


const startServer = async()=>{
  try {
    const { connectDB } = require("./configs/db");
    await connectDB();
    
    const { sequelize } = require("./configs/db");
    await sequelize.sync();
    console.log("Models synchronized");

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } 
  catch (error) {
    console.error("Failed to start server:", error);
  }
}

startServer();