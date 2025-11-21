// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Professor from "../models/Professor.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = {
      id: user._id,
      isSuspended: user.isSuspended,
      suspensionExpires: user.suspensionExpires,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const protectProfessor = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "professor") {
      return res.status(403).json({ message: "Professors only" });
    }

    const professor = await Professor.findById(decoded.id).select("-password");

    if (!professor) {
      return res.status(401).json({ message: "Professor not found" });
    }

    req.professor = {
      id: professor._id,
    };

    next();
  } catch (err) {
    console.error("Professor auth error:", err);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};


// middleware/checkSuspended.js
export const checkSuspended = (req, res, next) => {
  // assume `protect` (auth) middleware has already attached req.user
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.isSuspended) {
    return res.status(403).json({ message: "Account suspended. Access denied." });
  }
  next();
};





1 