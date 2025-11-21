// routes/studentTestRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import Test from "../models/Test.js";
import TestResult from "../models/TestResult.js";
import { protect, checkSuspended } from "../middleware/authMiddleware.js";


const router = express.Router();
router.use(protect, checkSuspended);


/* 🔐 Verify student token */
const verifyStudent = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "user")
      return res.status(403).json({ message: "Access denied. Students only." });

    req.studentId = decoded.id;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError")
      return res.status(401).json({ message: "Invalid token" });

    res.status(500).json({ message: "Server error" });
  }
};

/* 🕒 Utility to merge date + time assuming IST schedule */
const mergeDateTime = (dateObj, timeString) => {
  if (!dateObj || !timeString) return null;
  const baseDate = new Date(dateObj);
  if (Number.isNaN(baseDate.getTime())) return null;

  const isoDate = baseDate.toISOString().split("T")[0];
  return new Date(`${isoDate}T${timeString}:00.000+05:30`);
};

/* 📘 Get all available tests */
router.get("/available", verifyStudent, async (req, res) => {
  try {
    const now = new Date();

    const tests = await Test.find({})
      .populate("createdBy", "name")
      .sort({ scheduledDate: 1 });

    const studentResults = await TestResult.find({ student: req.studentId })
      .select("test score percentage");

    const resultsMap = {};
    studentResults.forEach((r) => {
      resultsMap[r.test.toString()] = {
        score: r.score,
        percentage: r.percentage,
      };
    });

    const testsWithStatus = tests.map((test) => {
      const testObj = test.toObject();

      const startTime = mergeDateTime(test.scheduledDate, test.scheduledTime);
      const endTime = new Date(
        startTime.getTime() + test.duration * 60 * 1000
      );

      let status = "Pending";
      if (now >= startTime && now <= endTime) status = "Active";
      else if (now > endTime) status = "Completed";

      return {
        ...testObj,
        status,
        hasAttempted: !!resultsMap[test._id],
        result: resultsMap[test._id] || null,
        startTimeIST: startTime.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        endTimeIST: endTime.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        nowIST: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      };
    });

    res.json({ tests: testsWithStatus });
  } catch (err) {
    console.error("Get available tests error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ✏️ Get a specific test for taking */
router.get("/:id", verifyStudent, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate("questions", "-answer")
      .populate("createdBy", "name");

    if (!test) return res.status(404).json({ message: "Test not found" });

    const startTime = mergeDateTime(test.scheduledDate, test.scheduledTime);
    const endTime = new Date(
      startTime.getTime() + test.duration * 60 * 1000
    );

    const now = new Date();

    if (now < startTime)
      return res.status(400).json({
        message: `Test has not started yet. Starts at: ${startTime.toLocaleString(
          "en-IN",
          { timeZone: "Asia/Kolkata" }
        )}`,
      });

    if (now > endTime)
      return res
        .status(400)
        .json({ message: "Test has ended. You cannot attempt it now." });

    const existingResult = await TestResult.findOne({
      test: test._id,
      student: req.studentId,
    });

    if (existingResult) {
      return res.status(400).json({
        message: "You have already attempted this test",
        result: {
          score: existingResult.score,
          totalQuestions: existingResult.totalQuestions,
          percentage: existingResult.percentage,
        },
      });
    }

    const testObj = test.toObject();
    testObj.questions = test.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
    }));

    res.json({ test: testObj });
  } catch (err) {
    console.error("Get test error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* 📝 SUBMIT A TEST */
router.post("/:id/submit", verifyStudent, async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;

    // Load test WITH correct answers for validation
    const test = await Test.findById(req.params.id)
      .populate({
        path: "questions",
        select: "+answer" // ensures answer is returned
      });

    if (!test) 
      return res.status(404).json({ message: "Test not found" });

    // Check if student already submitted
    const existingResult = await TestResult.findOne({
      test: test._id,
      student: req.studentId,
    });

    if (existingResult)
      return res.status(400).json({ message: "Test already submitted" });

    // Validate answers count
    if (!Array.isArray(answers) || answers.length !== test.questions.length) {
      return res.status(400).json({
        message: `Please answer all ${test.questions.length} questions`,
      });
    }

    let score = 0;
    const answerDetails = [];

    // Check each submitted answer
    const normalizeOption = (value) =>
      typeof value === "string" ? value.trim().toLowerCase() : null;

    for (const ans of answers) {
      const question = test.questions.find(
        (q) => q._id.toString() === ans.questionId
      );

      if (!question) {
        return res
          .status(400)
          .json({ message: `Question ID ${ans.questionId} not found` });
      }

      const correctAnswer = question.answer.toString().trim().toLowerCase();
      const submittedOption = normalizeOption(ans.selectedAnswer);
      const isAttempted = ["a", "b", "c", "d"].includes(submittedOption);
      const storedAnswer = isAttempted ? submittedOption : "na";

      const isCorrect = isAttempted && correctAnswer === storedAnswer;
      if (isCorrect) score++;

      answerDetails.push({
        questionId: question._id,
        selectedAnswer: storedAnswer,
        correctAnswer: question.answer,
        isCorrect,
      });
    }

    const percentage = Math.round((score / test.questions.length) * 100);

    const startedAt = new Date(Date.now() - (timeTaken || 0) * 60000);

    // Save the result
    const testResult = new TestResult({
      test: test._id,
      student: req.studentId,
      answers: answerDetails,
      score,
      totalQuestions: test.questions.length,
      percentage,
      startedAt,
      submittedAt: new Date(),
      timeTaken: timeTaken || 0,
    });

    await testResult.save();

    // Send response
    res.status(201).json({
      message: "Test submitted successfully",
      result: {
        score,
        totalQuestions: test.questions.length,
        percentage,
        answers: answerDetails,
      },
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
