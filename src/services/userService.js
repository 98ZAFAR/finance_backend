const {
  findUserByEmail,
  findUserById,
  createUser,
  listUsers,
  updateUser,
  removeUser,
} = require("../repositories/userRepository");
const { ApiError } = require("../utils/errors");

const toSafeUser = (user) => {
  const plain = user.get({ plain: true });
  delete plain.password;
  return plain;
};

const createManagedUser = async (payload) => {
  const existingUser = await findUserByEmail(payload.email);
  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const user = await createUser(payload);
  return toSafeUser(user);
};

const getUsers = async (query) => {
  const result = await listUsers(query);
  return {
    ...result,
    users: result.users.map((user) => user.get({ plain: true })),
  };
};

const getUser = async (id) => {
  const user = await findUserById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return toSafeUser(user);
};

const updateManagedUser = async (id, payload, actor) => {
  const user = await findUserById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.id === actor.id && payload.status === "inactive") {
    throw new ApiError(400, "You cannot deactivate your own account");
  }

  const existingUser =
    payload.email && payload.email !== user.email
      ? await findUserByEmail(payload.email)
      : null;

  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const updated = await updateUser(user, payload);
  return toSafeUser(updated);
};

const setUserStatus = async (id, status, actor) => {
  const user = await findUserById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.id === actor.id && status === "inactive") {
    throw new ApiError(400, "You cannot deactivate your own account");
  }

  const updated = await updateUser(user, { status });
  return toSafeUser(updated);
};

const deleteManagedUser = async (id, actor) => {
  const user = await findUserById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.id === actor.id) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  await removeUser(user);
};

module.exports = {
  createManagedUser,
  getUsers,
  getUser,
  updateManagedUser,
  setUserStatus,
  deleteManagedUser,
};
