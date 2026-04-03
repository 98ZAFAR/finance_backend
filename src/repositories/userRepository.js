const { Op } = require("sequelize");
const { User } = require("../models");

const findUserByEmail = async (email) => {
  return User.findOne({
    where: {
      email: email.toLowerCase(),
    },
  });
};

const findUserById = async (id) => {
  return User.findByPk(id);
};

const findActiveUserById = async (id) => {
  return User.findOne({
    where: {
      id,
      status: "active",
    },
  });
};

const countUsers = async () => {
  return User.count();
};

const createUser = async (payload) => {
  return User.create(payload);
};

const listUsers = async ({ role, status, search, page = 1, limit = 10 }) => {
  const where = {};

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      {
        email: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        name: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  const safePage = Number(page) || 1;
  const safeLimit = Number(limit) || 10;
  const offset = (safePage - 1) * safeLimit;

  const result = await User.findAndCountAll({
    where,
    attributes: { exclude: ["password"] },
    order: [["createdAt", "DESC"]],
    limit: safeLimit,
    offset,
  });

  return {
    users: result.rows,
    total: result.count,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(result.count / safeLimit)),
  };
};

const updateUser = async (user, payload) => {
  return user.update(payload);
};

const removeUser = async (user) => {
  return user.destroy();
};

module.exports = {
  findUserByEmail,
  findUserById,
  findActiveUserById,
  countUsers,
  createUser,
  listUsers,
  updateUser,
  removeUser,
};
