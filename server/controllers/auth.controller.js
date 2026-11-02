const User = require("../models/User");
const Employee = require("../models/Employee");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const userPayload = require("../utils/userPayload");

// POST /api/auth/register  (public self-signup; always creates an "employee")
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, department, designation, phone } = req.body;
  if (await User.findOne({ email })) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }
  const user = await User.create({ email, password, role: "employee" });
  let employee;
  try {
    employee = await Employee.create({ user: user._id, name, department, designation, phone });
  } catch (e) {
    await User.deleteOne({ _id: user._id });
    throw e;
  }
  res.status(201).json({ token: generateToken(user._id), user: userPayload(user, employee) });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }
  if (!user.isActive) return res.status(403).json({ message: "This account has been deactivated. Contact HR." });
  const employee = await Employee.findOne({ user: user._id }).populate("manager", "name designation");
  res.json({ token: generateToken(user._id), user: userPayload(user, employee) });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id }).populate("manager", "name designation");
  res.json({ user: userPayload(req.user, employee) });
});

// PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.matchPassword(currentPassword))) {
    return res.status(400).json({ message: "Current password is incorrect." });
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: "Password updated." });
});
