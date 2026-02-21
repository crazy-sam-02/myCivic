import { Report } from "../models/Report.js";
import uploadToCloudinary from "../utils/cloudinaryUploader.js";

export const resolveReport = async (req, res) => {
  try {
    const { reportId, notes } = req.body;
    const proofImage = req.file;

    if (!reportId) {
      return res.status(400).json({ success: false, message: "reportId is required" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    let proofImageUrl = "";
    if (proofImage) {
      try {
        const uploadRes = await uploadToCloudinary(proofImage.buffer, `resolve-${reportId}-${Date.now()}.jpg`);
        proofImageUrl = uploadRes.secure_url;
      } catch (uploadErr) {
        return res.status(500).json({ success: false, message: "Failed to upload proof image", error: uploadErr.message });
      }
    }

    report.status = "Resolved";
    report.resolution = {
      proofImageUrl: proofImageUrl || "",
      resolvedAt: new Date(),
      notes: notes || "",
    };

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report marked as resolved",
      report,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectReport = async (req, res) => {
  try {
    const { reportId, notes } = req.body;

    if (!reportId) {
      return res.status(400).json({ success: false, message: "reportId is required" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    report.status = "Rejected";
    report.resolution = {
      ...report.resolution,
      resolvedAt: new Date(),
      notes: notes || "Report rejected",
    };

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report marked as rejected",
      report,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const assignReport = async (req, res) => {
  try {
    const { reportId, department, assignedUserId } = req.body;

    if (!reportId) {
      return res.status(400).json({ success: false, message: "reportId is required" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    report.status = "In Progress";
    report.assignedTo = {
      department: department || "",
      user: assignedUserId || null,
    };

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report assigned successfully",
      report,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    const reports = await Report.find(filter)
      .populate("reportedBy", "name email role")
      .populate("assignedTo.user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate("reportedBy", "name email role avatar")
      .populate("assignedTo.user", "name email");

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
