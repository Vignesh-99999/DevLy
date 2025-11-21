import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Tutorial from "./models/tutorial.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mern_auth";
const dataDir = path.join(process.cwd(), "data");

// ====== Connect DB ======
async function connectDB() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");
}

function detectLanguageFromFilename(filename) {
  return filename
    .split("_")[0]
    .replace(/[-.]/g, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function slugify(text = "") {
  return text.toLowerCase().trim().replace(/\s+/g, "-");
}

// ✅ NEW: Transform flat array of objects into tabular format with headers + rows
function normalizeTables(tables = []) {
  if (!Array.isArray(tables) || tables.length === 0) return [];

  // Get consistent keys from the first object
  const keys = Object.keys(tables[0]);

  // Convert keys to headers (prettify)
  const headers = keys.map((key) =>
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );

  // Convert each row to array of values based on keys
  const rows = tables.map((row) => keys.map((key) => row[key] || ""));

  return [
    {
      headers,
      rows,
    },
  ];
}

function normalizeTopics(topics = []) {
  return topics.map((topic) => ({
    title: topic.title,
    description: topic.description || "",
    tables: normalizeTables(topic.tables),
    examples: topic.examples || [],
    extra: topic.extra || [],
    slug: topic.title ? slugify(topic.title) : undefined,
  }));
}

async function importFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  const filename = path.basename(filePath);
  const language = (data.language || detectLanguageFromFilename(filename)).toLowerCase();
  const title = data.title || `${language} Tutorial`;
  const slug = data.slug || slugify(title);

  const filter = { tutorialLanguage: language, slug };
  const update = {
    $set: {
      tutorialLanguage: language,
      title,
      slug,
      meta: data.meta || {},
      topics: normalizeTopics(data.topics || []),
    },
  };

  const existing = await Tutorial.findOne(filter);
  if (existing) {
    console.log(`🔁 Updating: ${title}`);
  } else {
    console.log(`🆕 Creating: ${title}`);
  }

  await Tutorial.findOneAndUpdate(filter, update, { upsert: true, new: true });
}

async function run() {
  try {
    await connectDB();

    // Optional: Clear all tutorials
    // await Tutorial.deleteMany({});
    // console.log("🧹 Cleared existing tutorials.");

    const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));

    if (!files.length) {
      console.warn("⚠️ No JSON files found in /data.");
      process.exit(0);
    }

    for (const f of files) {
      await importFile(path.join(dataDir, f));
    }

    console.log("✅ Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

run();
