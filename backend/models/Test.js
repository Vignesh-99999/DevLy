// models/Test.js
import mongoose from "mongoose";

const TestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true, enum: ["c", "cpp", "java", "py"] },
    difficulty: { type: Number, required: true, min: 1, max: 3 },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true }, // HH:MM
    duration: { type: Number, default: 60 }, // in minutes
    totalQuestions: { type: Number, default: 10 },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Professor", required: true },
    description: { type: String, default: "" },

    // Computed field
    status: {
      type: String,
      enum: ["Pending", "Active", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Compute real-time status
const buildIstDate = (dateValue, timeString) => {
  if (!dateValue || !timeString) return null;
  const baseDate = new Date(dateValue);
  if (Number.isNaN(baseDate.getTime())) return null;

  const isoDate = baseDate.toISOString().split("T")[0];
  return new Date(`${isoDate}T${timeString}:00.000+05:30`);
};

TestSchema.methods.calculateStatus = function () {
  const start = buildIstDate(this.scheduledDate, this.scheduledTime);
  if (!start) return "Pending";

  const end = new Date(start.getTime() + (this.duration || 0) * 60000);
  const now = new Date();

  if (now < start) return "Pending";
  if (now >= start && now <= end) return "Active";
  return "Completed";
};

// Auto-update before save
TestSchema.pre("save", function (next) {
  this.status = this.calculateStatus();
  next();
});

export default mongoose.model("Test", TestSchema);
