const { fn, col, literal } = require("sequelize");
const { Record, User } = require("../models");

const toNumber = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
};

const getSummaryMetrics = async () => {
  const [income, expense] = await Promise.all([
    Record.sum("amount", { where: { type: "income" } }),
    Record.sum("amount", { where: { type: "expense" } }),
  ]);

  const totalIncome = toNumber(income);
  const totalExpense = toNumber(expense);

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
  };
};

const getCategoryAggregation = async () => {
  const rows = await Record.findAll({
    attributes: [
      "category",
      [fn("SUM", col("amount")), "totalAmount"],
      [fn("COUNT", col("id")), "transactionCount"],
    ],
    group: ["category"],
    order: [[fn("SUM", col("amount")), "DESC"]],
    raw: true,
  });

  return rows.map((row) => ({
    category: row.category,
    totalAmount: toNumber(row.totalAmount),
    transactionCount: Number(row.transactionCount),
  }));
};

const getMonthlyTrends = async () => {
  const monthExpression = literal("DATE_TRUNC('month', \"date\")");

  const rows = await Record.findAll({
    attributes: [
      [monthExpression, "month"],
      "type",
      [fn("SUM", col("amount")), "totalAmount"],
    ],
    group: [monthExpression, "type"],
    order: [[monthExpression, "ASC"]],
    raw: true,
  });

  return rows.map((row) => ({
    month: new Date(row.month).toISOString().slice(0, 7),
    type: row.type,
    totalAmount: toNumber(row.totalAmount),
  }));
};

const getRecentTransactions = async (limit = 10) => {
  const rows = await Record.findAll({
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "name", "email", "role"],
      },
    ],
    order: [
      ["date", "DESC"],
      ["createdAt", "DESC"],
    ],
    limit,
  });

  return rows;
};

module.exports = {
  getSummaryMetrics,
  getCategoryAggregation,
  getMonthlyTrends,
  getRecentTransactions,
};
