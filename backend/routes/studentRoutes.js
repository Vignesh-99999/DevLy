import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // token middleware
import User from "../models/User.js";

const router = express.Router();

// Update profile
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only provided fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.number = req.body.number || user.number;
    user.country = req.body.country || user.country;

    if (req.body.password) {
      user.password = req.body.password; // hash middleware should handle this
    }

    const updatedUser = await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        number: updatedUser.number,
        country: updatedUser.country,
      },
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
