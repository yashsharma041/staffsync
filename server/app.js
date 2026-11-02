const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { protect } = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/error");
const { dashboard } = require("./controllers/report.controller");

const app = express();

app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_URL || "http://localhost:5173").split(","), credentials: true }));
app.use(express.json({ limit: "1mb" }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/employees", require("./routes/employee.routes"));
app.use("/api/manager", require("./routes/manager.routes"));
app.use("/api/attendance", require("./routes/attendance.routes"));
app.use("/api/leaves", require("./routes/leave.routes"));
app.use("/api/announcements", require("./routes/announcement.routes"));
app.use("/api/trainings", require("./routes/training.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.get("/api/dashboard", protect, dashboard);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
