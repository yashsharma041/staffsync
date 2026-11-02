// Usage: npm run seed   (WARNING: wipes all StaffSync collections first)
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Employee = require("./models/Employee");
const Attendance = require("./models/Attendance");
const Leave = require("./models/Leave");
const Announcement = require("./models/Announcement");
const Training = require("./models/Training");
const Notification = require("./models/Notification");

const PASSWORD = "Password@123";

async function make(email, role, profile) {
  const user = await User.create({ email, password: PASSWORD, role });
  return Employee.create({ user: user._id, ...profile });
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User, Employee, Attendance, Leave, Announcement, Training, Notification].map((m) => m.deleteMany({})));

  const hr = await make("hr@staffsync.com", "hr", { name: "Priya Sharma", department: "Human Resources", designation: "HR Lead", phone: "9000000001" });
  const mgr = await make("manager@staffsync.com", "manager", { name: "Rohan Mehta", department: "Engineering", designation: "Engineering Manager", phone: "9000000002", manager: hr._id });
  await make("employee@staffsync.com", "employee", { name: "Anika Verma", department: "Engineering", designation: "Software Engineer", phone: "9000000003", manager: mgr._id });
  await make("employee2@staffsync.com", "employee", { name: "Kabir Singh", department: "Engineering", designation: "QA Engineer", phone: "9000000004", manager: mgr._id });
  await make("design@staffsync.com", "employee", { name: "Meera Nair", department: "Design", designation: "Product Designer", phone: "9000000005", manager: mgr._id });

  await Announcement.create([
    { title: "Welcome to StaffSync", body: "Mark your attendance daily and apply for leave from the Leaves page.", audience: "all", postedBy: hr._id },
    { title: "Quarterly review window", body: "Managers: please complete team reviews before the end of the month.", audience: "manager", postedBy: hr._id },
  ]);

  const team = await Employee.find({ manager: mgr._id });
  await Training.create({
    title: "Secure coding basics",
    description: "Two-hour workshop on common web vulnerabilities.",
    startDate: new Date(Date.now() + 3 * 864e5),
    endDate: new Date(Date.now() + 3 * 864e5),
    assignedTo: team.map((t) => t._id),
    createdBy: mgr._id,
  });

  console.log("Seeded. Sign in with any of these (password: " + PASSWORD + "):");
  console.log("  HR        hr@staffsync.com");
  console.log("  Manager   manager@staffsync.com");
  console.log("  Employee  employee@staffsync.com");
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
