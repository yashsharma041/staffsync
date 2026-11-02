const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");

exports.protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized. Please sign in." });
  }
  try {
    const { id } = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user || !user.isActive) return res.status(401).json({ message: "Account not found or inactive." });
    req.user = user;
    req.employee = await Employee.findOne({ user: user._id });
    next();
  } catch (e) {
    res.status(401).json({ message: "Session expired or invalid. Please sign in again." });
  }
};
