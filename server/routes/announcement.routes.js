const router = require("express").Router();
const { body } = require("express-validator");
const c = require("../controllers/announcement.controller");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const validate = require("../middleware/validate");

const rules = [
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("body").trim().notEmpty().withMessage("Message is required."),
  body("audience").optional().isIn(["all", "employee", "manager"]).withMessage("Invalid audience."),
];

router.use(protect);
router.get("/", c.list);
router.post("/", authorize("hr"), rules, validate, c.create);
router.put("/:id", authorize("hr"), rules, validate, c.update);
router.delete("/:id", authorize("hr"), c.remove);

module.exports = router;
