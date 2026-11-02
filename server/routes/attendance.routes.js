const router = require("express").Router();
const c = require("../controllers/attendance.controller");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.use(protect);
router.post("/check-in", c.checkIn);
router.put("/check-out", c.checkOut);
router.get("/today", c.today);
router.get("/me", c.mine);
router.get("/", authorize("hr"), c.all);

module.exports = router;
