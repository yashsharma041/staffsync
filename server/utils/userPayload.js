module.exports = (user, employee) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  employee: employee || null,
});
