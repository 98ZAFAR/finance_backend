const ROLES = ["viewer", "analyst", "admin"];
const USER_STATUSES = ["active", "inactive"];
const RECORD_TYPES = ["income", "expense"];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isValidEmail = (email) => {
  if (typeof email !== "string") {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidDate = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
};

const isValidPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const isValidUuid = (value) => UUID_REGEX.test(value);

const isAllowedPaginationValue = (value, max = 100) => {
  if (value === undefined) {
    return true;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= max;
};

const validateLoginPayload = (payload) => {
  const errors = [];

  if (!isValidEmail(payload.email)) {
    errors.push("email must be a valid email address");
  }

  if (!isNonEmptyString(payload.password)) {
    errors.push("password is required");
  }

  return errors;
};

const validateRegistrationPayload = (payload) => {
  const errors = [];

  if (!isNonEmptyString(payload.name) || payload.name.trim().length < 2) {
    errors.push("name must be at least 2 characters");
  }

  if (!isValidEmail(payload.email)) {
    errors.push("email must be a valid email address");
  }

  if (
    !isNonEmptyString(payload.password) ||
    payload.password.trim().length < 8
  ) {
    errors.push("password must be at least 8 characters");
  }

  if (payload.role !== undefined && !ROLES.includes(payload.role)) {
    errors.push("role must be one of: viewer, analyst, admin");
  }

  if (
    payload.status !== undefined &&
    !USER_STATUSES.includes(payload.status)
  ) {
    errors.push("status must be one of: active, inactive");
  }

  return errors;
};

const validateUserUpdatePayload = (payload) => {
  const errors = [];

  if (!payload || Object.keys(payload).length === 0) {
    errors.push("at least one field is required for update");
    return errors;
  }

  if (payload.name !== undefined) {
    if (!isNonEmptyString(payload.name) || payload.name.trim().length < 2) {
      errors.push("name must be at least 2 characters");
    }
  }

  if (payload.role !== undefined && !ROLES.includes(payload.role)) {
    errors.push("role must be one of: viewer, analyst, admin");
  }

  if (
    payload.status !== undefined &&
    !USER_STATUSES.includes(payload.status)
  ) {
    errors.push("status must be one of: active, inactive");
  }

  if (payload.password !== undefined) {
    if (
      !isNonEmptyString(payload.password) ||
      payload.password.trim().length < 8
    ) {
      errors.push("password must be at least 8 characters");
    }
  }

  return errors;
};

const validateStatusPayload = (payload) => {
  const errors = [];

  if (!payload || !USER_STATUSES.includes(payload.status)) {
    errors.push("status must be one of: active, inactive");
  }

  return errors;
};

const validateUserListQuery = (query) => {
  const errors = [];

  if (query.role !== undefined && !ROLES.includes(query.role)) {
    errors.push("role filter must be one of: viewer, analyst, admin");
  }

  if (
    query.status !== undefined &&
    !USER_STATUSES.includes(query.status)
  ) {
    errors.push("status filter must be one of: active, inactive");
  }

  if (!isAllowedPaginationValue(query.page)) {
    errors.push("page must be a positive integer");
  }

  if (!isAllowedPaginationValue(query.limit)) {
    errors.push("limit must be a positive integer up to 100");
  }

  return errors;
};

const validateRecordCreatePayload = (payload) => {
  const errors = [];

  if (!RECORD_TYPES.includes(payload.type)) {
    errors.push("type must be one of: income, expense");
  }

  if (!isValidPositiveNumber(payload.amount)) {
    errors.push("amount must be a positive number");
  }

  if (!isNonEmptyString(payload.category)) {
    errors.push("category is required");
  }

  if (!isValidDate(payload.date)) {
    errors.push("date must be a valid date");
  }

  if (payload.note !== undefined && typeof payload.note !== "string") {
    errors.push("note must be a string");
  }

  return errors;
};

const validateRecordUpdatePayload = (payload) => {
  const errors = [];

  if (!payload || Object.keys(payload).length === 0) {
    errors.push("at least one field is required for update");
    return errors;
  }

  if (payload.type !== undefined && !RECORD_TYPES.includes(payload.type)) {
    errors.push("type must be one of: income, expense");
  }

  if (
    payload.amount !== undefined &&
    !isValidPositiveNumber(payload.amount)
  ) {
    errors.push("amount must be a positive number");
  }

  if (payload.category !== undefined && !isNonEmptyString(payload.category)) {
    errors.push("category must be a non-empty string");
  }

  if (payload.date !== undefined && !isValidDate(payload.date)) {
    errors.push("date must be a valid date");
  }

  if (payload.note !== undefined && typeof payload.note !== "string") {
    errors.push("note must be a string");
  }

  return errors;
};

const validateRecordFilterQuery = (query) => {
  const errors = [];

  if (query.type !== undefined && !RECORD_TYPES.includes(query.type)) {
    errors.push("type filter must be one of: income, expense");
  }

  if (query.startDate !== undefined && !isValidDate(query.startDate)) {
    errors.push("startDate must be a valid date");
  }

  if (query.endDate !== undefined && !isValidDate(query.endDate)) {
    errors.push("endDate must be a valid date");
  }

  if (
    isValidDate(query.startDate) &&
    isValidDate(query.endDate) &&
    new Date(query.startDate) > new Date(query.endDate)
  ) {
    errors.push("startDate must be before or equal to endDate");
  }

  if (query.category !== undefined && !isNonEmptyString(query.category)) {
    errors.push("category filter must be a non-empty string");
  }

  if (!isAllowedPaginationValue(query.page)) {
    errors.push("page must be a positive integer");
  }

  if (!isAllowedPaginationValue(query.limit)) {
    errors.push("limit must be a positive integer up to 100");
  }

  return errors;
};

const validateRecentQuery = (query) => {
  const errors = [];

  if (!isAllowedPaginationValue(query.limit, 50)) {
    errors.push("limit must be a positive integer up to 50");
  }

  return errors;
};

const validateIdParam = (payload) => {
  const errors = [];

  if (!isValidUuid(payload.id)) {
    errors.push("id must be a valid UUID");
  }

  return errors;
};

module.exports = {
  validateLoginPayload,
  validateRegistrationPayload,
  validateUserUpdatePayload,
  validateStatusPayload,
  validateUserListQuery,
  validateRecordCreatePayload,
  validateRecordUpdatePayload,
  validateRecordFilterQuery,
  validateRecentQuery,
  validateIdParam,
};
