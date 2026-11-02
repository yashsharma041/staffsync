const router = require("express").Router();
const { body } = require("express-validator");
const c = require("../controllers/leave.controller");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const validate = require("../middleware/validate");

router.use(protect);

router.post(
  "/",
  [
    body("type").isIn(["casual", "sick", "earned", "unpaid"]).withMessage("Choose a valid leave type."),
    body("fromDate").isISO8601().withMessage("Start date is required."),
    body("toDate").isISO8601().withMessage("End date is required."),
    body("reason").trim().notEmpty().withMessage("Please give a reason."),
  ],
  validate,
  c.apply
);
router.get("/me", c.mine);
router.get("/team", authorize("manager"), c.team);
router.get("/", authorize("hr"), c.all);
router.put(
  "/:id/review",
  authorize("manager", "hr"),
  [body("status").isIn(["approved", "rejected"]).withMessage("Status must be approved or rejected.")],
  validate,
  c.review
);
router.delete("/:id", c.cancel);

module.exports = router;
