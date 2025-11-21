import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import tutorialRoutes from "./routes/tutorialRoutes.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/adminRoutes.js";
import professorRoutes from "./routes/professorRoutes.js";
import userRoutes from "./routes/UserRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import studentTestRoutes from "./routes/studentTestRoutes.js";
import promoteStudentRoutes from "./routes/promoteStudent.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PROJECT_NAME = "DevLy";

// ✅ ENV
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ✅ CORS (Local + DevLy Domains supported automatically)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",

  // 🔴 DEVLY PRODUCTION DOMAINS
  "https://devly.onrender.com",
  "https://devly.vercel.app",
  "https://devly-admin.vercel.app",
  "https://devly-frontend.onrender.com",
  "https://devly-admin.onrender.com",

  process.env.FRONTEND_URL,
  process.env.ADMIN_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log(`✅ ${PROJECT_NAME} – MongoDB Connected`))
  .catch((err) => {
    console.error(`❌ ${PROJECT_NAME} – MongoDB Error:`, err.message);
    process.exit(1);
  });

// ✅ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/tutorials", tutorialRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/professors", professorRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/student-tests", studentTestRoutes);
app.use("/api/admin/users", promoteStudentRoutes);
app.use("/uploads", express.static("uploads"));

// ✅ Health check
app.get("/health", (req, res) => {
  res.json({
    project: PROJECT_NAME,
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// ✅ If you later build frontend inside backend
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build/index.html"));
  });
}

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error(`❌ ${PROJECT_NAME} – ERROR:`, err);
  res.status(500).json({ message: `${PROJECT_NAME} - Internal Server Error` });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 ${PROJECT_NAME} running at http://localhost:${PORT}`);
});
