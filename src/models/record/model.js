const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configs/db");

const Record = sequelize.define(
  "Record",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    category: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "records",
    timestamps: true,
    indexes: [
      {
        fields: ["date"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["category"],
      },
      {
        fields: ["userId", "date"],
      },
    ],
  },
);

module.exports = Record;
