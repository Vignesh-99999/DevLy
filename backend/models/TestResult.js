// models/TestResult.js
import mongoose from "mongoose";

const TestResultSchema = new mongoose.Schema(
  {
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
        selectedAnswer: {
          type: String,
          enum: ["a", "b", "c", "d", "na"],
          required: true,
          default: "na",
        },
        isCorrect: { type: Boolean, required: true },
      },
    ],
    score: { type: Number, required: true, default: 0 },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date, required: true },
    timeTaken: { type: Number, required: true }, // in minutes
  },
  { timestamps: true }
);

// Prevent duplicate submissions
TestResultSchema.index({ test: 1, student: 1 }, { unique: true });

const TestResult = mongoose.model("TestResult", TestResultSchema);

export default TestResult;

