import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ["Streetlights", "Roads & Infrastructure", "Waste Management", "Water Supply", "Other"],
        required: true,
    },
    severity: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        default: "Low",
    },
    status: {
        type: String,
        enum: ["Open", "In Progress", "Resolved", "Rejected"],
        default: "Open",
    },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String },
    },
    imageUrl: {
        type: String,
    },
    aiAnalysis: {
        category: String,
        severity: String,
        confidence: Number,
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    assignedTo: {
        department: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    resolution: {
        proofImageUrl: String,
        resolvedAt: Date,
        notes: String,
    },
    upvotes: {
        type: Number,
        default: 0,
    },
    commentCount: {
        type: Number,
        default: 0,
    },
    severityVotes: {
        low: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        high: { type: Number, default: 0 },
        critical: { type: Number, default: 0 },
    },
}, { timestamps: true });

export const Report = mongoose.model("Report", reportSchema);
