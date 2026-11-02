const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");
const notify = require("../utils/notify");
const { leaveDays } = require("../utils/dates");

const POPULATE = { path: "employee", select: "name department designation manager" };

// POST /api/leaves
exports.apply = asyncHandler(async (req, res) => {
  const { type, fromDate, toDate, reason } = req.body;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (to < from) return res.status(400).json({ message: "End date cannot be before the start date." });

  const days = leaveDays(from, to);

  const overlap = await Leave.findOne({
    employee: req.employee._id,
    status: { $in: ["pending", "approved"] },
    fromDate: { $lte: to },
    toDate: { $gte: from },
  });
  if (overlap) return res.status(400).json({ message: "You already have a leave request for these dates." });

  if (type !== "unpaid") {
    const balance = req.employee.leaveBalance?.[type] ?? 0;
    if (days > balance) {
      return res.status(400).json({ message: `Not enough ${type} leave. You have ${balance} day(s) left.` });
    }
  }

  const leave = await Leave.create({ employee: req.employee._id, type, fromDate: from, toDate: to, days, reason });

  // Tell the manager (or nothing if there is none; HR sees everything anyway)
  if (req.employee.manager) {
    const mgr = await Employee.findById(req.employee.manager);
    if (mgr) await notify(mgr.user, `${req.employee.name} requested ${days} day(s) of ${type} leave.`, "leave");
  }
  res.status(201).json(leave);
});

// GET /api/leaves/me
exports.mine = asyncHandler(async (req, res) => {
  const filter = { employee: req.employee._id };
  if (req.query.status) filter.status = req.query.status;
  res.json(await paginate(Leave, filter, req, { populate: { path: "reviewedBy", select: "name" } }));
});

// GET /api/leaves/team  (manager)
exports.team = asyncHandler(async (req, res) => {
  const ids = (await Employee.find({ manager: req.employee._id }).select("_id")).map((e) => e._id);
  const filter = { employee: { $in: ids } };
  if (req.query.status) filter.status = req.query.status;
  res.json(await paginate(Leave, filter, req, { populate: POPULATE }));
});

// GET /api/leaves  (HR)
exports.all = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  res.json(await paginate(Leave, filter, req, { populate: POPULATE }));
});

// PUT /api/leaves/:id/review  (manager of that employee, or HR)  body: { status, remarks }
exports.review = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  const leave = await Leave.findById(req.params.id).populate("employee");
  if (!leave) return res.status(404).json({ message: "Leave request not found." });
  if (leave.status !== "pending") {
    return res.status(400).json({ message: `This request has already been ${leave.status}.` });
  }

  const owner = leave.employee;
  if (String(owner._id) === String(req.employee._id)) {
    return res.status(403).json({ message: "You cannot review your own leave request." });
  }
  const isTheirManager = String(owner.manager) === String(req.employee._id);
  if (req.user.role !== "hr" && !isTheirManager) {
    return res.status(403).json({ message: "You can only review leave requests from your own team." });
  }

  if (status === "approved" && leave.type !== "unpaid") {
    // Atomic: deduct only if enough balance remains
    const key = `leaveBalance.${leave.type}`;
    const updated = await Employee.findOneAndUpdate(
      { _id: owner._id, [key]: { $gte: leave.days } },
      { $inc: { [key]: -leave.days } }
    );
    if (!updated) {
      return res.status(400).json({ message: `${owner.name} does not have enough ${leave.type} leave left.` });
    }
  }

  leave.status = status;
  leave.remarks = remarks;
  leave.reviewedBy = req.employee._id;
  leave.reviewedAt = new Date();
  await leave.save();

  await notify(
    owner.user,
    `Your ${leave.type} leave (${leave.days} day${leave.days > 1 ? "s" : ""}) was ${status}.${remarks ? " Note: " + remarks : ""}`,
    "leave"
  );
  res.json(leave);
});

// DELETE /api/leaves/:id  – employee cancels their own pending request
exports.cancel = asyncHandler(async (req, res) => {
  const leave = await Leave.findOne({ _id: req.params.id, employee: req.employee._id });
  if (!leave) return res.status(404).json({ message: "Leave request not found." });
  if (leave.status !== "pending") {
    return res.status(400).json({ message: "Only pending requests can be cancelled." });
  }
  leave.status = "cancelled";
  await leave.save();
  res.json(leave);
});
