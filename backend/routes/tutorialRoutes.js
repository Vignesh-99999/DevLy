import express from "express";
import Tutorial from "../models/tutorial.js";

const router = express.Router();

// Helper functions
const handleError = (res, err, message) => {
  console.error(message, err);
  res.status(500).json({ ok: false, error: "Server error" });
};

const createLanguageFilter = (language) => ({
  tutorialLanguage: { $regex: new RegExp(`^${language.toLowerCase()}$`, "i") }
});

// GET all tutorials
router.get("/", async (req, res) => {
  try {
    const tutorials = await Tutorial.find().lean();
    res.json({ ok: true, tutorials });
  } catch (err) {
    handleError(res, err, "Error fetching all tutorials:");
  }
});

// GET distinct languages
router.get("/languages", async (req, res) => {
  try {
    const languages = await Tutorial.distinct("tutorialLanguage");
    res.json({ ok: true, languages });
  } catch (err) {
    handleError(res, err, "Error fetching languages:");
  }
});

// GET tutorials by language (case-insensitive)
router.get("/:language", async (req, res) => {
  try {
    const { language } = req.params;
    const { q = "", page = 1, limit = 20 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = createLanguageFilter(language);
    if (q.trim()) filter.$text = { $search: q };

    const [total, tutorials] = await Promise.all([
      Tutorial.countDocuments(filter),
      Tutorial.find(filter).skip(skip).limit(limitNum).lean()
    ]);

    res.json({ ok: true, total, page: pageNum, tutorials });
  } catch (err) {
    handleError(res, err, "Error fetching tutorials by language:");
  }
});

// GET detail by language + slug or ID
router.get("/:language/:slugOrId/detail", async (req, res) => {
  try {
    const { language, slugOrId } = req.params;
    
    const filter = {
      ...createLanguageFilter(language),
      $or: [{ slug: slugOrId }, { _id: slugOrId }]
    };

    const tutorial = await Tutorial.findOne(filter).lean();
    if (!tutorial) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }

    res.json({ ok: true, tutorial });
  } catch (err) {
    handleError(res, err, "Error fetching tutorial detail:");
  }
});

export default router;
