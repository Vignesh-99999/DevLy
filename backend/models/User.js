// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  profilePic: { type: String, default: "" },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  number: { type: String, default: null, unique: true },
  country: { type: String, default: null }, 
  password: { type: String, required: true },
  isSuspended: { type: Boolean, default: false },
  suspensionExpires: { type: Date, default: null },
  isBanned: { type: Boolean, default: false },

  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null }, // store hashed OTP
  otpExpires: { type: Date, default: null },
  otpResendCount: { type: Number, default: 0 },
  otpResendAt: { type: Date, default: null },
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

export default User;
