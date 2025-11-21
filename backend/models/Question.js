  import mongoose from "mongoose";

  const QuestionSchema = new mongoose.Schema(
    {
      question: { type: String, required: true },
      options: {
        a: { type: String, required: true },
        b: { type: String, required: true },
        c: { type: String, required: true },
        d: { type: String, required: true },
      },
      answer: { type: String, required: true, enum: ["a", "b", "c", "d"] },
      difficulty: { type: Number, required: true, min: 1, max: 3 },
      subject: { type: String, required: true, enum: ["c", "cpp", "java", "py"] },
    },
    { timestamps: true }
  );

  QuestionSchema.index({ subject: 1, difficulty: 1 });

  const Question = mongoose.model("Question", QuestionSchema,"mcq_test");

  export default Question;

