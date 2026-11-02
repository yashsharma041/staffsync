const router = require("express").Router();
const { body } = require("express-validator");
const c = require("../controllers/training.controller");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const validate = require("../middleware/validate");

const rules = [
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("startDate").isISO8601().withMessage("Start date is required."),
  body("endDate").isISO8601().withMessage("End date is required."),
];

router.use(protect);
router.get("/me", c.mine);
router.get("/", authorize("manager", "hr"), c.list);
router.post("/", authorize("manager", "hr"), rules, validate, c.create);
router.put("/:id", authorize("manager", "hr"), c.update);
router.delete("/:id", authorize("manager", "hr"), c.remove);

module.exports = router;
