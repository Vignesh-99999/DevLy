import express from "express";
import bcrypt from "bcryptjs";
import Professor from "../models/Professor.js";
import User from "../models/User.js";
import { protectProfessor } from "../middleware/authMiddleware.js";
import {
  sendAppointmentEmail,
  sendResignationEmail,
} from "../utils/mail.js";

const router = express.Router();

/* ---------------------------------------------------------
   ✅ Helper: Standard Error Handler
--------------------------------------------------------- */
const handleError = (res, err, msg) => {
  console.error(msg, err);
  res.status(500).json({ success: false, message: "Server error" });
};

/* ---------------------------------------------------------
   ✅ Helper: Validate Required Fields
--------------------------------------------------------- */
const validateFields = (fields, res) => {
  const missing = Object.entries(fields).filter(([_, v]) => !v);
  if (missing.length > 0) {
    res.status(400).json({
      success: false,
      message: "Please fill all required fields",
    });
    return false;
  }
  return true;
};

/* ---------------------------------------------------------
   ✅ Helper: Check duplicate professor email
--------------------------------------------------------- */
const checkProfessorEmail = async (email, exclude = null) => {
  const q = { email };
  if (exclude) q._id = { $ne: exclude };
  return await Professor.findOne(q);
};
/* ---------------------------------------------------------
   ✅ Promote Student → Professor (Create Professor)
--------------------------------------------------------- */
router.post("/", async (req, res) => {
  try {
    const { name, email, password, education, subjects } = req.body;

    // ✅ Field validation
    if (!validateFields({ name, email, password, education }, res)) return;

    // ✅ Check if email already exists as professor
    if (await checkProfessorEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email already registered as professor",
      });
    }

    // ✅ Hash password
    const hashedPass = await bcrypt.hash(password, 10);

    // ✅ Create Professor
    const professor = await Professor.create({
      name,
      email,
      password: hashedPass,
      education,
      subjects: Array.isArray(subjects) ? subjects : [],
      origin: "appointed" 
    });

    // ✅ Send Appointment Email
    console.log("📧 Sending appointment email...");
    const emailSent = await sendAppointmentEmail(email, name, education, subjects);

    return res.status(201).json({
      success: true,
      message: "Professor created successfully",
      professor,
      emailStatus: emailSent ? "success" : "failed",
    });

  } catch (err) {
    console.error("❌ Promote error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
  
});

/* ---------------------------------------------------------
   👩‍🏫 Logged-in Professor Profile
--------------------------------------------------------- */
router.get("/profile", protectProfessor, async (req, res) => {
  try {
    const professor = await Professor.findById(req.professor.id).select(
      "-password"
    );

    if (!professor) {
      return res.status(404).json({
        success: false,
        message: "Professor not found",
      });
    }

    res.json({
      _id: professor._id,
      name: professor.name,
      email: professor.email,
      education: professor.education || "",
      subjects: professor.subjects || [],
    });
  } catch (err) {
    handleError(res, err, "Fetch professor profile error:");
  }
});

router.put("/profile", protectProfessor, async (req, res) => {
  try {
    const { name, email, education, subjects, password } = req.body;

    const professor = await Professor.findById(req.professor.id);
    if (!professor) {
      return res.status(404).json({
        success: false,
        message: "Professor not found",
      });
    }

    if (email && email !== professor.email) {
      if (await checkProfessorEmail(email, professor._id)) {
        return res.status(400).json({
          success: false,
          message: "Email already used by another professor",
        });
      }
      professor.email = email;
    }

    if (name) professor.name = name;
    if (education) professor.education = education;
    if (Array.isArray(subjects)) professor.subjects = subjects;
    if (password) {
      professor.password = await bcrypt.hash(password, 10);
    }

    await professor.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      professor: {
        _id: professor._id,
        name: professor.name,
        email: professor.email,
        education: professor.education,
        subjects: professor.subjects,
      },
    });
  } catch (err) {
    handleError(res, err, "Update professor profile error:");
  }
});


/* ---------------------------------------------------------
   ✅ Get All Professors
--------------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const list = await Professor.find().select(
      "name email education subjects createdAt"
    );
    res.json({ success: true, professors: list });
  } catch (err) {
    handleError(res, err, "Fetch professors error:");
  }
});

/* ---------------------------------------------------------
   ✅ Update Professor Details
--------------------------------------------------------- */
router.put("/:id", async (req, res) => {
  try {
    const { name, email, password, education, subjects } = req.body;

    // ✅ Check duplicate email (except own)
    if (email && (await checkProfessorEmail(email, req.params.id))) {
      return res.status(400).json({
        success: false,
        message: "Email already used by another professor",
      });
    }

    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (education) update.education = education;
    if (subjects) update.subjects = Array.isArray(subjects) ? subjects : [];
    if (password) update.password = await bcrypt.hash(password, 10);

    const updated = await Professor.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Professor not found",
      });
    }

    res.json({
      success: true,
      message: "Professor updated successfully",
      professor: updated,
    });
  } catch (err) {
    handleError(res, err, "Update professor error:");
  }
});

/* ---------------------------------------------------------
   ✅ Resign Professor → Convert Back to Student
   ✅ No duplicate email
   ✅ No duplicate number
   ✅ Safe upsert
--------------------------------------------------------- */
router.delete("/:id", async (req, res) => {
  try {
    const prof = await Professor.findById(req.params.id);

    if (!prof) {
      return res.status(404).json({
        success: false,
        message: "Professor not found",
      });
    }

    let emailStatus = "failed";

    // ✅ CASE 1: PROMOTED → restore to student
    if (prof.origin === "promoted") {

      await User.findOneAndUpdate(
        { email: prof.email },
        {
          $set: {
            name: prof.name,
            email: prof.email,
            password: prof.password,
            role: "student",
            isVerified: true,
            isSuspended: false,
            isBanned: false,
            resignedAt: new Date(),
          },
        },
        { new: true, upsert: true }
      );

      await Professor.findByIdAndDelete(prof._id);

      try {
        await sendResignationEmail(prof.email, prof.name);
        emailStatus = "success";
      } catch (err) {
        console.error("Email error:", err.message);
      }

      return res.json({
        success: true,
        message: "Promoted professor resigned and restored as student ✅",
        emailStatus,
      });
    }

    // ✅ CASE 2: APPOINTED → delete only BUT still send email
    if (prof.origin === "appointed") {

      await Professor.findByIdAndDelete(prof._id);

      try {
        await sendResignationEmail(prof.email, prof.name);
        emailStatus = "success";
      } catch (err) {
        console.error("Email error:", err.message);
      }

      return res.json({
        success: true,
        message: "Appointed professor resigned and permanently removed ❌",
        emailStatus,
      });
    }

  } catch (err) {
    console.error("Resignation error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during resignation",
    });
  }
});

export default router;
