const Announcement = require("../models/Announcement");
const User = require("../models/User");
const Employee = require("../models/Employee");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");
const notify = require("../utils/notify");

// GET /api/announcements
exports.list = asyncHandler(async (req, res) => {
  const filter = req.user.role === "hr" ? {} : { audience: { $in: ["all", req.user.role] } };
  res.json(await paginate(Announcement, filter, req, { populate: { path: "postedBy", select: "name" } }));
});

// POST /api/announcements  (HR)
exports.create = asyncHandler(async (req, res) => {
  const { title, body, audience } = req.body;
  const item = await Announcement.create({ title, body, audience, postedBy: req.employee._id });

  const roles = audience === "all" || !audience ? ["employee", "manager", "hr"] : [audience];
  const users = await User.find({ role: { $in: roles }, isActive: true, _id: { $ne: req.user._id } }).select("_id");
  await Promise.all(users.map((u) => notify(u._id, `New announcement: ${title}`, "announcement")));

  res.status(201).json(item);
});

// PUT /api/announcements/:id  (HR)
exports.update = asyncHandler(async (req, res) => {
  const { title, body, audience } = req.body;
  const item = await Announcement.findByIdAndUpdate(
    req.params.id,
    { title, body, audience },
    { new: true, runValidators: true }
  );
  if (!item) return res.status(404).json({ message: "Announcement not found." });
  res.json(item);
});

// DELETE /api/announcements/:id  (HR)
exports.remove = asyncHandler(async (req, res) => {
  const item = await Announcement.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Announcement not found." });
  res.json({ message: "Announcement deleted." });
});
