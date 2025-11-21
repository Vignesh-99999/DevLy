// seedAdmin.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/mern_auth"; // adjust if needed

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    const hashedPassword = await bcrypt.hash("admin123", 10); // change password

    const admin = new Admin({
      name: "Super Admin",
      email: "admin@admin.com",
      password: hashedPassword,
    });

    await admin.save();
    console.log("✅ Admin created:", admin);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();