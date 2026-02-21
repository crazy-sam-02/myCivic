import mongoose from "mongoose";

const severityVoteSchema = new mongoose.Schema(
  {
    report: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true,
    },
  },
  { timestamps: true }
);

severityVoteSchema.index({ report: 1, user: 1 }, { unique: true });

export const SeverityVote = mongoose.model("SeverityVote", severityVoteSchema);
