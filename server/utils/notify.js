const Notification = require("../models/Notification");

// recipient is a User id
module.exports = async (recipient, message, type = "info") => {
  if (!recipient) return;
  try {
    await Notification.create({ recipient, message, type });
  } catch (e) {
    console.error("Notification failed:", e.message);
  }
};
