// routes/testRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
// import { protect, checkSuspended } from "../middleware/authMiddleware.js";

const router = express.Router();

// router.use(protect, checkSuspended);

/* 🔐 Verify professor token */
const verifyProfessor = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "professor") return res.status(403).json({ message: "Forbidden" });

    req.professorId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* 📘 Get all tests */
router.get("/", verifyProfessor, async (req, res) => {
  try {
    const tests = await Test.find({ createdBy: req.professorId })
      .populate("questions", "question difficulty")
      .populate("createdBy", "name email")
      .sort({ scheduledDate: -1 });

    // Refresh statuses dynamically
    tests.forEach((t) => (t.status = t.calculateStatus()));

    res.json({ tests });
  } catch (err) {
    console.error("Get tests error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* 🧩 Create test */
router.post("/", verifyProfessor, async (req, res) => {
  try {
    const {
      title,
      subject,
      difficulty,
      scheduledDate,
      scheduledTime,
      duration,
      totalQuestions,
      description,
    } = req.body;

    if (!title || !subject || !difficulty || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedSubject = subject.toLowerCase();
    const normalizedDifficulty = Number(difficulty);

    const questions = await Question.find({
      subject: normalizedSubject,
      difficulty: normalizedDifficulty,
    });

    if (questions.length < totalQuestions) {
      return res
        .status(400)
        .json({ message: `Not enough questions available (${questions.length})` });
    }

    const selectedQuestions = questions.sort(() => 0.5 - Math.random()).slice(0, totalQuestions);

    const test = new Test({
      title,
      subject: normalizedSubject,
      difficulty: normalizedDifficulty,
      scheduledDate,
      scheduledTime,
      duration,
      totalQuestions,
      description,
      createdBy: req.professorId,
      questions: selectedQuestions.map((q) => q._id),
    });

    await test.save();

    res.status(201).json({ message: "Test created successfully", test });
  } catch (err) {
    console.error("Create test error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ✏️ Update test (only if Pending) */
router.put("/:id", verifyProfessor, async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      createdBy: req.professorId,
    });

    if (!test) return res.status(404).json({ message: "Test not found" });

    test.status = test.calculateStatus();
    if (test.status !== "Pending") {
      return res.status(400).json({ message: `Cannot edit ${test.status} test` });
    }

    const updateFields = [
      "title",
      "subject",
      "difficulty",
      "scheduledDate",
      "scheduledTime",
      "duration",
      "totalQuestions",
      "description",
    ];

    updateFields.forEach((f) => {
      if (req.body[f] !== undefined) test[f] = req.body[f];
    });

    // regenerate questions if subject/difficulty changed
    if (req.body.subject || req.body.difficulty || req.body.totalQuestions) {
      const newQs = await Question.find({
        subject: test.subject,
        difficulty: test.difficulty,
      });

      if (newQs.length < test.totalQuestions) {
        return res.status(400).json({ message: "Not enough questions available" });
      }

      test.questions = newQs.sort(() => 0.5 - Math.random()).slice(0, test.totalQuestions);
    }

    await test.save();
    res.json({ message: "Test updated successfully", test });
  } catch (err) {
    console.error("Update test error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* 🗑️ Delete test (only if Pending) */
router.delete("/:id", verifyProfessor, async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      createdBy: req.professorId,
    });

    if (!test) return res.status(404).json({ message: "Test not found" });

    const status = test.calculateStatus();
    if (status !== "Pending") {
      return res.status(400).json({ message: `Cannot delete ${status} test` });
    }

    await Test.deleteOne({ _id: test._id });
    res.json({ message: "Test deleted successfully" });
  } catch (err) {
    console.error("Delete test error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
