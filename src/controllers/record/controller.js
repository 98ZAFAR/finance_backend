const {
	createFinancialRecord,
	getFinancialRecords,
	getFinancialRecord,
	updateFinancialRecord,
	deleteFinancialRecord,
} = require("../../services/recordService");
const { invalidateDashboardCache } = require("../../services/dashboardService");
const { asyncHandler } = require("../../utils/asyncHandler");

const createRecordController = asyncHandler(async (req, res) => {
	const record = await createFinancialRecord(req.body, req.user);
	await invalidateDashboardCache();

	res.status(201).json({
		message: "Record created successfully",
		data: record,
	});
});

const listRecordsController = asyncHandler(async (req, res) => {
	const result = await getFinancialRecords(req.query);
	res.status(200).json({
		message: "Records fetched successfully",
		data: result,
	});
});

const getRecordController = asyncHandler(async (req, res) => {
	const record = await getFinancialRecord(req.params.id);
	res.status(200).json({
		message: "Record fetched successfully",
		data: record,
	});
});

const updateRecordController = asyncHandler(async (req, res) => {
	const record = await updateFinancialRecord(req.params.id, req.body);
	await invalidateDashboardCache();

	res.status(200).json({
		message: "Record updated successfully",
		data: record,
	});
});

const deleteRecordController = asyncHandler(async (req, res) => {
	await deleteFinancialRecord(req.params.id);
	await invalidateDashboardCache();

	res.status(200).json({
		message: "Record deleted successfully",
	});
});

module.exports = {
	createRecordController,
	listRecordsController,
	getRecordController,
	updateRecordController,
	deleteRecordController,
};
