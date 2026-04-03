const { sequelize } = require("../configs/db");
const User = require("./auth/model");
const Record = require("./record/model");

User.hasMany(Record, {
  foreignKey: "userId",
  as: "records",
  onDelete: "CASCADE",
});

Record.belongsTo(User, {
  foreignKey: "userId",
  as: "owner",
});

module.exports = {
  sequelize,
  User,
  Record,
};