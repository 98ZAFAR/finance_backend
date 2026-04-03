const {
  createRecord,
  findRecordById,
  listRecords,
  updateRecord,
  removeRecord,
} = require("../repositories/recordRepository");
const { findUserById } = require("../repositories/userRepository");
const { ApiError } = require("../utils/errors");

const toRecordDto = (record) => {
  const plain = record.get({ plain: true });
  return {
    ...plain,
    amount: Number(plain.amount),
  };
};

const createFinancialRecord = async (payload, actor) => {
  const ownerId = payload.userId || actor.id;

  const owner = await findUserById(ownerId);
  if (!owner) {
    throw new ApiError(404, "Owner user not found");
  }

  const record = await createRecord({
    userId: ownerId,
    type: payload.type,
    amount: payload.amount,
    category: payload.category,
    date: payload.date,
    note: payload.note || null,
  });

  const hydrated = await findRecordById(record.id);
  return toRecordDto(hydrated);
};

const getFinancialRecords = async (query) => {
  const result = await listRecords(query);

  return {
    ...result,
    records: result.records.map(toRecordDto),
  };
};

const getFinancialRecord = async (id) => {
  const record = await findRecordById(id);
  if (!record) {
    throw new ApiError(404, "Record not found");
  }

  return toRecordDto(record);
};

const updateFinancialRecord = async (id, payload) => {
  const record = await findRecordById(id);
  if (!record) {
    throw new ApiError(404, "Record not found");
  }

  await updateRecord(record, payload);
  const updated = await findRecordById(id);
  return toRecordDto(updated);
};

const deleteFinancialRecord = async (id) => {
  const record = await findRecordById(id);
  if (!record) {
    throw new ApiError(404, "Record not found");
  }

  await removeRecord(record);
};

module.exports = {
  createFinancialRecord,
  getFinancialRecords,
  getFinancialRecord,
  updateFinancialRecord,
  deleteFinancialRecord,
};
