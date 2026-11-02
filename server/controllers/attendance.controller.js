const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");
const { todayStr } = require("../utils/dates");

const isLate = (now) => {
  const [h, m] = (process.env.WORK_START || "09:30").split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() > h * 60 + m;
};

const dateFilter = (q) => {
  if (q.date) return q.date;
  const range = {};
  if (q.from) range.$gte = q.from;
  if (q.to) range.$lte = q.to;
  if (q.month) return { $regex: `^${q.month}` };
  return Object.keys(range).length ? range : undefined;
};

// POST /api/attendance/check-in
exports.checkIn = asyncHandler(async (req, res) => {
  if (!req.employee) return res.status(400).json({ message: "No employee profile found." });
  const date = todayStr();
  if (await Attendance.findOne({ employee: req.employee._id, date })) {
    return res.status(400).json({ message: "You have already checked in today." });
  }
  const now = new Date();
  const record = await Attendance.create({
    employee: req.employee._id,
    date,
    checkIn: now,
    status: isLate(now) ? "late" : "present",
  });
  res.status(201).json(record);
});

// PUT /api/attendance/check-out
exports.checkOut = asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({ employee: req.employee._id, date: todayStr() });
  if (!record) return res.status(400).json({ message: "Check in first before checking out." });
  if (record.checkOut) return res.status(400).json({ message: "You have already checked out today." });
  record.checkOut = new Date();
  record.hoursWorked = Math.round(((record.checkOut - record.checkIn) / 36e5) * 100) / 100;
  if (record.hoursWorked < 4) record.status = "half-day";
  await record.save();
  res.json(record);
});

// GET /api/attendance/today
exports.today = asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({ employee: req.employee._id, date: todayStr() });
  res.json({ record });
});

// GET /api/attendance/me  ?month=YYYY-MM
exports.mine = asyncHandler(async (req, res) => {
  const filter = { employee: req.employee._id };
  const d = dateFilter(req.query);
  if (d) filter.date = d;
  res.json(await paginate(Attendance, filter, req, { sort: { date: -1 } }));
});

// GET /api/manager/team/attendance  ?date=
exports.team = asyncHandler(async (req, res) => {
  const ids = (await Employee.find({ manager: req.employee._id }).select("_id")).map((e) => e._id);
  const filter = { employee: { $in: ids } };
  const d = dateFilter(req.query);
  if (d) filter.date = d;
  res.json(
    await paginate(Attendance, filter, req, {
      sort: { date: -1 },
      populate: { path: "employee", select: "name department designation" },
    })
  );
});

// GET /api/attendance  (HR) ?date=&department=&employee=
exports.all = asyncHandler(async (req, res) => {
  const filter = {};
  const d = dateFilter(req.query);
  if (d) filter.date = d;
  if (req.query.employee) filter.employee = req.query.employee;
  if (req.query.department) {
    const ids = (await Employee.find({ department: req.query.department }).select("_id")).map((e) => e._id);
    filter.employee = { $in: ids };
  }
  res.json(
    await paginate(Attendance, filter, req, {
      sort: { date: -1 },
      populate: { path: "employee", select: "name department designation" },
    })
  );
});
