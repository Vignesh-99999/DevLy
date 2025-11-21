import mongoose from "mongoose";

const ProfessorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    education: { type: String, required: true },
    subjects: {
      type: [
        {
          type: String,
          enum: ["C", "C++", "Java", "Python"],
        },
      ],
      default: [],
    },
    origin: {
      type: String,
      enum: ["promoted", "appointed"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Professor = mongoose.model("Professor", ProfessorSchema);

export default Professor;


