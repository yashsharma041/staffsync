const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");

// GET /api/notifications
exports.list = asyncHandler(async (req, res) => {
  const result = await paginate(Notification, { recipient: req.user._id }, req);
  const unread = await Notification.countDocuments({ recipient: req.user._id, read: false });
  res.json({ ...result, unread });
});

// PUT /api/notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, recipient: req.user._id }, { read: true });
  res.json({ message: "Marked as read." });
});

// PUT /api/notifications/read-all
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ message: "All notifications marked as read." });
});
