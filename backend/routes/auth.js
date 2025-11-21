// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Professor from "../models/Professor.js";

const router = express.Router();

// -----------------------
// Helpers
// -----------------------
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOtpEmail = async (toEmail, otp) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to: toEmail,
    subject: "Your OTP for account verification",
    html: `<p>Your OTP is <b>${otp}</b>. Expires in 10 minutes.</p>`,
  });
};

const handleError = (res, err, message = "Server error") => {
  console.error(message, err);
  return res.status(500).json({ message });
};

// -----------------------
// SIGNUP – generate OTP
// -----------------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, number, password, country } = req.body;

    if (!name || !email || !number || !password || !country)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await User.findOne({ $or: [{ email }, { number }] });
    if (existing) {
      const field = existing.email === email ? "Email" : "Phone number";
      return res.status(400).json({ message: `${field} already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const newUser = new User({
      name,
      email,
      number,
      country,
      password: hashedPassword,
      isVerified: false,
      isSuspended: false,
      isBanned: false,               // NEW
      suspensionExpires: null,
      otp: hashedOtp,
      otpExpires: Date.now() + 10 * 60 * 1000,
    });

    await newUser.save();
    await sendOtpEmail(email, otp);

    return res.json({ message: "OTP sent to email", email });
  } catch (err) {
    return handleError(res, err, "Signup error");
  }
});

// -----------------------
// VERIFY OTP
// -----------------------
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.isVerified)
      return res.json({ message: "Account already verified" });

    if (!user.otp || !user.otpExpires || user.otpExpires < Date.now())
      return res.status(400).json({ message: "OTP expired. Resend OTP." });

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.json({ message: "Verification successful. You can now log in." });
  } catch (err) {
    return handleError(res, err, "Verify OTP error");
  }
});

// -----------------------
// LOGIN — includes: BAN + SUSPEND
// -----------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    // -----------------------------------
    // ADMIN LOGIN
    // -----------------------------------
    if (role === "admin") {
      const admin = await Admin.findOne({ email });
      if (!admin) return res.status(400).json({ message: "Invalid credentials" });

      const match = await bcrypt.compare(password, admin.password);
      if (!match) return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        { id: admin._id, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.json({ message: "Admin login successful", token, role: "admin" });
    }

    // -----------------------------------
    // PROFESSOR LOGIN
    // -----------------------------------
    if (role === "professor") {
      const professor = await Professor.findOne({ email });
      if (!professor) return res.status(400).json({ message: "Invalid credentials" });

      if (!professor.isActive)
        return res.status(403).json({ message: "Your account is inactive. Contact admin." });

      const match = await bcrypt.compare(password, professor.password);
      if (!match) return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        { id: professor._id, role: "professor" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.json({
        message: "Professor login successful",
        token,
        role: "professor",
        professor: {
          name: professor.name,
          email: professor.email,
          education: professor.education,
          subjects: professor.subjects,
        },
      });
    }

    // -----------------------------------
    // STUDENT LOGIN
    // -----------------------------------
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // 🚫 BLOCK LOGIN IF USER IS BANNED
    if (user.isBanned)
      return res.status(403).json({
        message: "Your account is banned. Contact admin.",
        banned: true,
      });

    // Auto unsuspend if time is over
    if (user.isSuspended && user.suspensionExpires && user.suspensionExpires < new Date()) {
      user.isSuspended = false;
      user.suspensionExpires = null;
      await user.save();
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(403).json({ message: "Email not verified. Please verify your account." });

    const tokenPayload = {
      id: user._id,
      role: "user",
      suspended: user.isSuspended,
      banned: user.isBanned,  // 🔥 include banned in token also
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.json({
      user: {
        name: user.name,
        email: user.email,
        profilePic: user.profilePic || null,
      },
      token,
      role: "user",
      suspended: user.isSuspended,
      banned: user.isBanned,
      suspensionExpires: user.suspensionExpires,
      message: user.isSuspended
        ? "Your account is suspended. You cannot use features for 7 days."
        : "Login successful",
    });

  } catch (err) {
    return handleError(res, err, "Login error");
  }
});

export default router;
