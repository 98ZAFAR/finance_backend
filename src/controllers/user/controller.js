const {
  createManagedUser,
  getUsers,
  getUser,
  updateManagedUser,
  setUserStatus,
  deleteManagedUser,
} = require("../../services/userService");
const { asyncHandler } = require("../../utils/asyncHandler");

const createUserController = asyncHandler(async (req, res) => {
  const user = await createManagedUser(req.body);
  res.status(201).json({
    message: "User created successfully",
    data: user,
  });
});

const listUsersController = asyncHandler(async (req, res) => {
  const result = await getUsers(req.query);
  res.status(200).json({
    message: "Users fetched successfully",
    data: result,
  });
});

const getUserController = asyncHandler(async (req, res) => {
  const user = await getUser(req.params.id);
  res.status(200).json({
    message: "User fetched successfully",
    data: user,
  });
});

const updateUserController = asyncHandler(async (req, res) => {
  const user = await updateManagedUser(req.params.id, req.body, req.user);
  res.status(200).json({
    message: "User updated successfully",
    data: user,
  });
});

const updateUserStatusController = asyncHandler(async (req, res) => {
  const user = await setUserStatus(req.params.id, req.body.status, req.user);
  res.status(200).json({
    message: "User status updated successfully",
    data: user,
  });
});

const deleteUserController = asyncHandler(async (req, res) => {
  await deleteManagedUser(req.params.id, req.user);
  res.status(200).json({
    message: "User deleted successfully",
  });
});

module.exports = {
  createUserController,
  listUsersController,
  getUserController,
  updateUserController,
  updateUserStatusController,
  deleteUserController,
};
