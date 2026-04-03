const { Op } = require("sequelize");
const { Record, User } = require("../models");

const createRecord = async (payload) => {
  return Record.create(payload);
};

const findRecordById = async (id) => {
  return Record.findByPk(id, {
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "name", "email", "role"],
      },
    ],
  });
};

const listRecords = async ({
  type,
  category,
  startDate,
  endDate,
  page = 1,
  limit = 10,
}) => {
  const where = {};

  if (type) {
    where.type = type;
  }

  if (category) {
    where.category = category;
  }

  if (startDate || endDate) {
    where.date = {};

    if (startDate) {
      where.date[Op.gte] = startDate;
    }

    if (endDate) {
      where.date[Op.lte] = endDate;
    }
  }

  const safePage = Number(page) || 1;
  const safeLimit = Number(limit) || 10;
  const offset = (safePage - 1) * safeLimit;

  const result = await Record.findAndCountAll({
    where,
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
    limit: safeLimit,
    offset,
  });

  return {
    records: result.rows,
    total: result.count,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(result.count / safeLimit)),
  };
};

const updateRecord = async (record, payload) => {
  return record.update(payload);
};

const removeRecord = async (record) => {
  return record.destroy();
};

module.exports = {
  createRecord,
  findRecordById,
  listRecords,
  updateRecord,
  removeRecord,
};
