const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["scheduled", "ongoing", "completed", "cancelled"], default: "scheduled" },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  },
  { timestamps: true }
);

trainingSchema.index({ assignedTo: 1 });
trainingSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Training", trainingSchema);
