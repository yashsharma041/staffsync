const router = require("express").Router();
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const c = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("Enter a valid email.").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  validate,
  c.register
);
router.post(
  "/login",
  loginLimiter,
  [body("email").isEmail().withMessage("Enter a valid email.").normalizeEmail(), body("password").notEmpty().withMessage("Password is required.")],
  validate,
  c.login
);
router.get("/me", protect, c.me);
router.put(
  "/password",
  protect,
  [body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters.")],
  validate,
  c.changePassword
);

module.exports = router;
