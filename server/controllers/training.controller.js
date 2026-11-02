const Training = require("../models/Training");
const Employee = require("../models/Employee");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");
const notify = require("../utils/notify");

const POPULATE = [
  { path: "assignedTo", select: "name department user" },
  { path: "createdBy", select: "name" },
];

// Managers may only assign people from their own team; HR may assign anyone.
const validateAssignees = async (req, ids = []) => {
  if (!ids.length) return [];
  const filter = { _id: { $in: ids } };
  if (req.user.role === "manager") filter.manager = req.employee._id;
  const found = await Employee.find(filter).select("_id user");
  if (found.length !== new Set(ids.map(String)).size) {
    const err = new Error(
      req.user.role === "manager" ? "You can only assign training to your own team members." : "Some employees were not found."
    );
    err.status = 400;
    throw err;
  }
  return found;
};

// GET /api/trainings/me  – training assigned to the signed-in person
exports.mine = asyncHandler(async (req, res) => {
  res.json(
    await paginate(Training, { assignedTo: req.employee._id }, req, {
      populate: { path: "createdBy", select: "name" },
      sort: { startDate: -1 },
    })
  );
});

// GET /api/trainings  (manager: own programmes, HR: all)
exports.list = asyncHandler(async (req, res) => {
  const filter = req.user.role === "hr" ? {} : { createdBy: req.employee._id };
  res.json(await paginate(Training, filter, req, { populate: POPULATE, sort: { startDate: -1 } }));
});

// POST /api/trainings
exports.create = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, assignedTo = [], status } = req.body;
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ message: "End date cannot be before the start date." });
  }
  const people = await validateAssignees(req, assignedTo);
  const training = await Training.create({
    title, description, startDate, endDate, status,
    assignedTo: people.map((p) => p._id),
    createdBy: req.employee._id,
  });
  await Promise.all(people.map((p) => notify(p.user, `You were enrolled in training: ${title}`, "training")));
  res.status(201).json(await training.populate(POPULATE));
});

// PUT /api/trainings/:id
exports.update = asyncHandler(async (req, res) => {
  const training = await Training.findById(req.params.id);
  if (!training) return res.status(404).json({ message: "Training not found." });
  if (req.user.role !== "hr" && String(training.createdBy) !== String(req.employee._id)) {
    return res.status(403).json({ message: "You can only edit training programmes you created." });
  }

  const { title, description, startDate, endDate, status, assignedTo } = req.body;
  let newlyAdded = [];
  if (assignedTo) {
    const people = await validateAssignees(req, assignedTo);
    const before = new Set(training.assignedTo.map(String));
    newlyAdded = people.filter((p) => !before.has(String(p._id)));
    training.assignedTo = people.map((p) => p._id);
  }
  Object.assign(training, Object.fromEntries(
    Object.entries({ title, description, startDate, endDate, status }).filter(([, v]) => v !== undefined)
  ));
  await training.save();
  await Promise.all(newlyAdded.map((p) => notify(p.user, `You were enrolled in training: ${training.title}`, "training")));
  res.json(await training.populate(POPULATE));
});

// DELETE /api/trainings/:id
exports.remove = asyncHandler(async (req, res) => {
  const training = await Training.findById(req.params.id);
  if (!training) return res.status(404).json({ message: "Training not found." });
  if (req.user.role !== "hr" && String(training.createdBy) !== String(req.employee._id)) {
    return res.status(403).json({ message: "You can only delete training programmes you created." });
  }
  await training.deleteOne();
  res.json({ message: "Training deleted." });
});
