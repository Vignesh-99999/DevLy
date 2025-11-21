// routes/UserRoutes.js
import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------- multer setup (simple) ---------- */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/"); // make sure folder exists
  },
  filename(req, file, cb) {
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

/* ---------- GET /api/users/profile ---------- */
router.get("/profile", protect, async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("GET /profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------- PUT /api/users/profile ---------- */
router.put("/profile", protect, upload.single("profilePic"), async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update simple fields if provided
    user.name = req.body.name ?? user.name;
    user.email = req.body.email ?? user.email;
    user.number = req.body.number ?? user.number;
    user.country = req.body.country ?? user.country;

    // Update password (only if provided and non-empty)
    if (req.body.password && req.body.password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    // Update profilePic (if a new file uploaded)
    if (req.file) {
      // store as '/uploads/filename' so frontend can prepend host easily
      user.profilePic = `/uploads/${req.file.filename}`;
    }

    await user.save();

    // return updated user (without password)
    const updatedUser = await User.findById(userId).select("-password");
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("PUT /profile error:", err);

    // duplicate key (unique) error handling
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {}).join(", ");
      return res.status(400).json({ message: `${duplicateField} already exists` });
    }

    // multer errors (file size etc) will be caught here, return 400 if needed
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: "Update failed" });
  }
});

export default router;
