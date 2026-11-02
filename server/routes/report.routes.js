const router = require("express").Router();
const c = require("../controllers/report.controller");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(protect, authorize("hr"));
router.get("/headcount", c.headcount);
router.get("/attendance-summary", c.attendanceSummary);
router.get("/leave-summary", c.leaveSummary);

module.exports = router;
