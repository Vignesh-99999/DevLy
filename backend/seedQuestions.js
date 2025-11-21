import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Question from "./models/Question.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mern_auth";
const dataDir = path.join(__dirname, "data");

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

// Determine subject from filename
function getSubjectFromFilename(filename) {
  filename = filename.toLowerCase();

  // Match C files (but exclude C++)
  if (/^(c_test|c_|c$)/.test(filename) && !filename.includes("cpp") && !filename.includes("c++")) return "c";

  // Match C++ files
  if (/^(cpp_test|cpp_|c\+\+|c\+\+_test)/.test(filename)) return "cpp";

  // Match Java files
  if (/^(java_test|java_)/.test(filename)) return "java";

  // Match Python files
  if (/^(python_test|python_)/.test(filename)) return "py";

  return null;
}

// Import questions from a single JSON file
async function importQuestions(filePath) {
  const filename = path.basename(filePath);
  const subject = getSubjectFromFilename(filename);

  if (!subject) {
    console.log(`⚠️ Skipping ${filename}: Could not determine subject`);
    return;
  }

  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`❌ Failed to read ${filename}:`, err.message);
    return;
  }

  let questions;
  try {
    questions = JSON.parse(raw);
    if (!Array.isArray(questions)) throw new Error("Not an array");
  } catch (err) {
    console.error(`❌ Failed to parse ${filename}:`, err.message);
    return;
  }

  let imported = 0;
  let skipped = 0;

  for (const q of questions) {
    try {
      const exists = await Question.findOne({ question: q.question, subject });
      if (exists) {
        skipped++;
        continue;
      }

      const difficulty =
        ["1", "2", "3"].includes(q.difficulty?.toString()) ? q.difficulty.toString() : "1";

      const question = new Question({
        question: q.question,
        options: q.options,
        answer: q.answer,
        difficulty,
        subject: q.subject || subject,
      });

      await question.save();
      imported++;
    } catch (err) {
      console.error(`❌ Error saving question "${q.question}":`, err.message);
    }
  }

  console.log(`✅ ${filename}: Imported ${imported}, Skipped ${skipped} duplicates`);
}

// Main runner
async function run() {
  await connectDB();

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith("_test.json"));
  if (files.length === 0) {
    console.log("⚠️ No test JSON files found in data directory");
    mongoose.disconnect();
    return;
  }

  console.log(`📁 Found ${files.length} test file(s)`);

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    await importQuestions(filePath);
  }

  console.log("\n✅ All questions imported successfully!");
  await mongoose.disconnect();
}

run();
