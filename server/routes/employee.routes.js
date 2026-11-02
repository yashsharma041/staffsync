const router = require("express").Router();
const { body } = require("express-validator");
const c = require("../controllers/employee.controller");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const validate = require("../middleware/validate");

router.use(protect);

router.put("/me", c.updateMe);
router.get("/managers", authorize("hr"), c.managers);
router.get("/departments", authorize("hr", "manager"), c.departments);

router
  .route("/")
  .get(authorize("hr"), c.list)
  .post(
    authorize("hr"),
    [
      body("name").trim().notEmpty().withMessage("Name is required."),
      body("email").isEmail().withMessage("Enter a valid email.").normalizeEmail(),
      body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
    ],
    validate,
    c.create
  );

router.route("/:id").get(c.getOne).put(authorize("hr"), c.update).delete(authorize("hr"), c.remove);

module.exports = router;
