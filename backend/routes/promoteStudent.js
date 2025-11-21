import express from "express";
import User from "../models/User.js";
import Professor from "../models/Professor.js";
import { sendAppointmentEmail, sendResignationEmail } from "../utils/mail.js";

const router = express.Router();

/* -------------------------------------------
 ✅ 1. Promote Student → Professor
-------------------------------------------- */
router.post("/:id/promote", async (req, res) => {
  try {
    const { id } = req.params;
    const { subjects, education } = req.body;

    if (!subjects || !education) {
      return res.status(400).json({
        success: false,
        message: "Subjects and education are required.",
      });
    }

    // ✅ Find the student
    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

     // ✅ ALREADY PROMOTED CHECK
    if (student.role === "professor" || student.isProfessor === true) {
      return res.status(409).json({
        success: false,
        message: "Student is already promoted to Professor.",
      });
    }

    // ✅ Create new Professor from Student data
    const newProfessor = await Professor.create({
      name: student.name,
      email: student.email,
      password: student.password, // already hashed
      education,
      subjects,
      origin: "promoted"
    });

    // ✅ Remove student record
    //await User.findByIdAndDelete(id);

    // ✅ Send Appointment Email
    let emailStatus = "failed";
    try {
      await sendAppointmentEmail(student.email, student.name, education, subjects);
      emailStatus = "success";
    } catch (err) {
      console.error("Email sending failed:", err.message);
    }

    return res.json({
      success: true,
      message: "Student promoted to professor successfully.",
      emailStatus,
      professor: newProfessor,
    });
  } catch (err) {
    console.error("Promotion Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during promotion.",
    });
  }
});

/* -------------------------------------------
 ✅ 2. Resign Professor → Convert Back to Student
-------------------------------------------- */
router.post("/:id/resign", async (req, res) => {
  try {
    const { id } = req.params;

    const professor = await Professor.findById(id);
    if (!professor) {
      return res.status(404).json({ success: false, message: "Professor not found" });
    }

    // ✅ CASE 1: PROMOTED professor → restore as student
    if (professor.origin === "promoted") {
      await User.create({
        name: professor.name,
        email: professor.email,
        password: professor.password,
      });
    }

    // ✅ CASE 2: APPOINTED professor → DO NOT restore
    // Just remove them
    await Professor.findByIdAndDelete(id);

    return res.json({
      success: true,
      message:
        professor.origin === "promoted"
          ? "Professor resigned and restored to student list"
          : "Appointed professor resigned and removed permanently",
    });

  } catch (error) {
    console.error("Resign Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during resignation",
    });
  }
});


export default router;
