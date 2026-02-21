import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    report: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 200, trim: true },
  },
  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
