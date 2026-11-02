const User = require("../models/User");
const Employee = require("../models/Employee");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PROFILE_FIELDS = ["name", "phone", "address", "emergencyContact"];
const HR_FIELDS = [...PROFILE_FIELDS, "department", "designation", "joinDate", "manager", "leaveBalance"];

const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

// GET /api/employees  (HR) ?search=&department=&page=&limit=
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.department) filter.department = req.query.department;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), "i");
    filter.$or = [{ name: rx }, { department: rx }, { designation: rx }];
  }
  const result = await paginate(Employee, filter, req, {
    populate: [
      { path: "user", select: "email role isActive" },
      { path: "manager", select: "name" },
    ],
    sort: { name: 1 },
  });
  res.json(result);
});

// GET /api/employees/managers  (HR) – people who can be assigned as a manager
exports.managers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $in: ["manager", "hr"] }, isActive: true }).select("_id");
  const items = await Employee.find({ user: { $in: users.map((u) => u._id) } }).select("name designation");
  res.json({ items });
});

// GET /api/employees/departments
exports.departments = asyncHandler(async (req, res) => {
  res.json({ items: (await Employee.distinct("department")).sort() });
});

// GET /api/employees/:id  (HR any, manager own team, self)
exports.getOne = asyncHandler(async (req, res) => {
  const emp = await Employee.findById(req.params.id)
    .populate("user", "email role isActive")
    .populate("manager", "name");
  if (!emp) return res.status(404).json({ message: "Employee not found." });

  const isSelf = String(emp._id) === String(req.employee?._id);
  const isTeam = req.user.role === "manager" && String(emp.manager?._id) === String(req.employee?._id);
  if (req.user.role !== "hr" && !isSelf && !isTeam) {
    return res.status(403).json({ message: "You can only view your own profile or your team." });
  }
  res.json(emp);
});

// POST /api/employees  (HR)
exports.create = asyncHandler(async (req, res) => {
  const { email, password, role = "employee", ...rest } = req.body;
  if (!["employee", "manager", "hr"].includes(role)) return res.status(400).json({ message: "Invalid role." });
  if (await User.findOne({ email })) return res.status(409).json({ message: "Email already in use." });

  const user = await User.create({ email, password, role });
  try {
    const data = Object.fromEntries(Object.entries(pick(rest, HR_FIELDS)).filter(([, v]) => v !== "" && v !== null));
    const emp = await Employee.create({ user: user._id, ...data });
    res.status(201).json(await emp.populate("user", "email role isActive"));
  } catch (e) {
    await User.deleteOne({ _id: user._id });
    throw e;
  }
});

// PUT /api/employees/:id  (HR)
exports.update = asyncHandler(async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  if (!emp) return res.status(404).json({ message: "Employee not found." });

  const data = pick(req.body, HR_FIELDS);
  if (data.manager === "") data.manager = null;
  if (data.manager && String(data.manager) === String(emp._id)) {
    return res.status(400).json({ message: "An employee cannot be their own manager." });
  }
  Object.assign(emp, data);
  await emp.save();

  const userUpdate = {};
  if (req.body.role && ["employee", "manager", "hr"].includes(req.body.role)) userUpdate.role = req.body.role;
  if (typeof req.body.isActive === "boolean") userUpdate.isActive = req.body.isActive;
  if (Object.keys(userUpdate).length) {
    if (String(emp.user) === String(req.user._id) && (userUpdate.role || userUpdate.isActive === false)) {
      return res.status(400).json({ message: "You cannot change your own role or deactivate yourself." });
    }
    await User.updateOne({ _id: emp.user }, userUpdate);
  }
  res.json(await Employee.findById(emp._id).populate("user", "email role isActive").populate("manager", "name"));
});

// DELETE /api/employees/:id  (HR) – deactivates the account (keeps history)
exports.remove = asyncHandler(async (req, res) => {
  const emp = await Employee.findById(req.params.id);
  if (!emp) return res.status(404).json({ message: "Employee not found." });
  if (String(emp.user) === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot deactivate your own account." });
  }
  await User.updateOne({ _id: emp.user }, { isActive: false });
  res.json({ message: "Employee deactivated." });
});

// PUT /api/employees/me  (any signed-in user)
exports.updateMe = asyncHandler(async (req, res) => {
  Object.assign(req.employee, pick(req.body, PROFILE_FIELDS));
  await req.employee.save();
  res.json(await Employee.findById(req.employee._id).populate("manager", "name designation"));
});

// GET /api/manager/team
exports.team = asyncHandler(async (req, res) => {
  const result = await paginate(Employee, { manager: req.employee._id }, req, {
    populate: { path: "user", select: "email role isActive" },
    sort: { name: 1 },
  });
  res.json(result);
});
