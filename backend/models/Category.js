import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    department: { type: String, default: "General Office" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);
