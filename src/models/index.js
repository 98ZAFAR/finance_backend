const { sequilize} = require("sequelize");
const User = require("./auth/model");
const Record = require("./record/model");

// Define associations
User.hasMany(Record, { foreignKey: "userId", onDelete: "CASCADE" });
Record.belongsTo(User, { foreignKey: "userId" });

module.exports = {
  User,
  Record,
};