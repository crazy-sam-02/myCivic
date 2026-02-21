import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Object, default: {} },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
