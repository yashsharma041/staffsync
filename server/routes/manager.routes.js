const router = require("express").Router();
const employee = require("../controllers/employee.controller");
const attendance = require("../controllers/attendance.controller");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(protect, authorize("manager"));
router.get("/team", employee.team);
router.get("/team/attendance", attendance.team);

module.exports = router;
