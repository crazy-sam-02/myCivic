import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    city: { type: String, default: "" },
    area: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Location = mongoose.model("Location", locationSchema);
