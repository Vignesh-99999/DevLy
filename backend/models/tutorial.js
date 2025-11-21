import mongoose from "mongoose";

const { Schema } = mongoose;

const ExampleSchema = new Schema(
  {
    code: { type: String },
    output: { type: Schema.Types.Mixed },
    explanation: { type: String },
  },
  { _id: false }
);

const TopicSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    tables: { type: [Schema.Types.Mixed], default: [] },
    examples: { type: [ExampleSchema], default: [] },
    extra: { type: [String], default: [] },
    slug: { type: String },
  },
  { _id: false }
);

const TutorialSchema = new Schema(
  {
    tutorialLanguage: { type: String, required: true, lowercase: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, index: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    topics: { type: [TopicSchema], default: [] },
  },
  { timestamps: true }
);

TutorialSchema.index({
  title: "text",
  "topics.title": "text",
  "topics.description": "text",
});

export default mongoose.model("Tutorial", TutorialSchema);