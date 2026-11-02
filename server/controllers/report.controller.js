const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Announcement = require("../models/Announcement");
const Training = require("../models/Training");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { todayStr } = require("../utils/dates");

const monthStr = () => todayStr().slice(0, 7);

// GET /api/reports/headcount  (HR)
exports.headcount = asyncHandler(async (req, res) => {
  const items = await Employee.aggregate([
    { $group: { _id: "$department", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, department: "$_id", count: 1 } },
  ]);
  res.json({ items });
});

// GET /api/reports/attendance-summary?month=YYYY-MM  (HR)
exports.attendanceSummary = asyncHandler(async (req, res) => {
  const month = req.query.month || monthStr();
  const items = await Attendance.aggregate([
    { $match: { date: { $regex: `^${month}` } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } },
  ]);
  res.json({ month, items });
});

// GET /api/reports/leave-summary  (HR)
exports.leaveSummary = asyncHandler(async (req, res) => {
  const [byStatus, byType] = await Promise.all([
    Leave.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { _id: 0, status: "$_id", count: 1 } }]),
    Leave.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$type", days: { $sum: "$days" } } },
      { $project: { _id: 0, type: "$_id", days: 1 } },
    ]),
  ]);
  res.json({ byStatus, byType });
});

// GET /api/dashboard  – returns the right summary for the signed-in role
exports.dashboard = asyncHandler(async (req, res) => {
  const today = todayStr();
  const todayDate = new Date(today);
  const role = req.user.role;
  const announcementFilter = role === "hr" ? {} : { audience: { $in: ["all", role] } };
  const announcements = await Announcement.find(announcementFilter)
    .sort({ createdAt: -1 })
    .limit(4)
    .populate("postedBy", "name");

  if (role === "hr") {
    const [totalEmployees, activeUsers, presentToday, pendingLeaves, onLeaveToday, headcount, leavesByStatus] =
      await Promise.all([
        Employee.countDocuments(),
        User.countDocuments({ isActive: true }),
        Attendance.countDocuments({ date: today }),
        Leave.countDocuments({ status: "pending" }),
        Leave.countDocuments({ status: "approved", fromDate: { $lte: todayDate }, toDate: { $gte: todayDate } }),
        Employee.aggregate([
          { $group: { _id: "$department", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { _id: 0, department: "$_id", count: 1 } },
        ]),
        Leave.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { _id: 0, status: "$_id", count: 1 } }]),
      ]);
    return res.json({ role, totalEmployees, activeUsers, presentToday, pendingLeaves, onLeaveToday, headcount, leavesByStatus, announcements });
  }

  if (role === "manager") {
    const team = await Employee.find({ manager: req.employee._id }).select("_id");
    const ids = team.map((t) => t._id);
    const [presentToday, pendingLeaves, trainings, myToday] = await Promise.all([
      Attendance.countDocuments({ employee: { $in: ids }, date: today }),
      Leave.countDocuments({ employee: { $in: ids }, status: "pending" }),
      Training.countDocuments({ createdBy: req.employee._id, status: { $in: ["scheduled", "ongoing"] } }),
      Attendance.findOne({ employee: req.employee._id, date: today }),
    ]);
    return res.json({ role, teamSize: ids.length, presentToday, pendingLeaves, trainings, today: myToday, leaveBalance: req.employee.leaveBalance, announcements });
  }

  const [myToday, pendingLeaves, trainings] = await Promise.all([
    Attendance.findOne({ employee: req.employee._id, date: today }),
    Leave.countDocuments({ employee: req.employee._id, status: "pending" }),
    Training.countDocuments({ assignedTo: req.employee._id, status: { $in: ["scheduled", "ongoing"] } }),
  ]);
  res.json({ role, today: myToday, pendingLeaves, trainings, leaveBalance: req.employee.leaveBalance, announcements });
});
