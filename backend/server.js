import express from "express";
import mongoose from "mongoose";
import cors from "cors";
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

// -------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PROJECT_NAME = "DevLy";

// -------------------------------
// HARD-CODED CONFIG
// -------------------------------
const PORT = 5000; // or process.env.PORT if you prefer dynamic
const MONGO_URI = "mongodb+srv://vigljku_db_user:wYS5YNCbFSpu8G2k@mernauth.ysoggzy.mongodb.net/mern_auth?retryWrites=true&w=majority";


// Allowed frontend domains
const allowedOrigins = [
  "http://localhost:3000",                 // User local
  "http://localhost:3001",                 // Admin local
  "https://devly-frontend.onrender.com",   // User prod
  "https://devly-admin.onrender.com",      // Admin prod
];

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

// -------------------------------
// MONGO CONNECTION
// -------------------------------
mongoose
  .connect(MONGO_URI)
  .then(() => console.log(`✅ ${PROJECT_NAME} – MongoDB Connected`))
  .catch((err) => {
    console.error(`❌ ${PROJECT_NAME} – MongoDB Error:`, err.message);
    process.exit(1);
  });

// -------------------------------
// ROUTES
// -------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/tutorials", tutorialRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/professors", professorRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/student-tests", studentTestRoutes);
app.use("/api/admin/users", promoteStudentRoutes);
app.use("/uploads", express.static("uploads"));

// -------------------------------
// HEALTH CHECK
// -------------------------------
app.get("/health", (req, res) => {
  res.json({
    project: PROJECT_NAME,
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// -------------------------------
// FRONTEND SERVE (OPTIONAL)
// -------------------------------
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build/index.html"));
  });
}

// -------------------------------
// GLOBAL ERROR HANDLER
// -------------------------------
app.use((err, req, res, next) => {
  console.error(`❌ ${PROJECT_NAME} – ERROR:`, err);
  res.status(500).json({ message: `${PROJECT_NAME} - Internal Server Error` });
});

// -------------------------------
// START SERVER
// -------------------------------
app.listen(PORT, () => {
  console.log(`🚀 ${PROJECT_NAME} running at http://localhost:${PORT}`);
});
