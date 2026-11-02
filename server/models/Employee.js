const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    department: { type: String, trim: true, default: "General" },
    designation: { type: String, trim: true, default: "Staff" },
    joinDate: { type: Date, default: Date.now },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    leaveBalance: {
      casual: { type: Number, default: 12 },
      sick: { type: Number, default: 8 },
      earned: { type: Number, default: 15 },
    },
  },
  { timestamps: true }
);

employeeSchema.index({ manager: 1 });
employeeSchema.index({ department: 1 });

module.exports = mongoose.model("Employee", employeeSchema);
