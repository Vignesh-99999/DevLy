import User from "../models/User.js";

const blockSuspendedUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Auto-unsuspend if expired
    if (user.isSuspended && user.suspendedUntil) {
      if (new Date(user.suspendedUntil) <= new Date()) {
        user.isSuspended = false;
        user.suspendedUntil = null;
        await user.save();
      }
    }

    // ❌ Block if still suspended
    if (user.isSuspended) {
      return res.status(403).json({
        message:
          "Your account is suspended. You cannot access this feature.",
      });
    }

    next();
  } catch (err) {
    console.error("blockSuspendedUser Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export default blockSuspendedUser;
