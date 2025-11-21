import express from "express";
import Student from "../models/User.js";
import Tutorial from "../models/tutorial.js";
import Admin from "../models/Admin.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const students = await Student.countDocuments();
    const tutorials = await Tutorial.countDocuments();
    const admins = await Admin.countDocuments();
    const uniqueTopicTitles = await Tutorial.distinct("topics.title");

    res.json({
      students,
      tutorials, 
      admins,
      topicCount: uniqueTopicTitles.length  
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ✅ GET all users
router.get("/users", async (req, res) => {
  try {
    const students = await Student.find();   // fetch from Mongo
    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// ✅ Toggle suspend
router.patch("/users/:id/toggle-suspend", async (req, res) => {
  try {
    const user = await Student.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isSuspended) {
      // Suspend for 7 days
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);

      user.isSuspended = true;
      user.suspensionExpires = expires;
    } else {
      // Unsuspend manually
      user.isSuspended = false;
      user.suspensionExpires = null;
    }

    await user.save();

    res.json({
      success: true,
      isSuspended: user.isSuspended,
      suspensionExpires: user.suspensionExpires,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Toggle ban
router.patch("/users/:id/toggle-ban", async (req, res) => {
  try {
    const user = await Student.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({
      success: true,
      isBanned: user.isBanned,
      message: `User ${user.isBanned ? "banned" : "unbanned"} successfully`,
    });
  } catch (err) {
    console.error("Error toggling ban:", err);
    res.status(500).json({ success: false, message: "Server error while banning user" });
  }
});


export default router;