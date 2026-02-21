
import { Report } from "../models/Report.js";
import { Comment } from "../models/Comment.js";
import { Vote } from "../models/Vote.js";
import { SeverityVote } from "../models/SeverityVote.js";
import { Notification } from "../models/Notification.js";

// Create a new report (User)
export const createReport = async (req, res) => {
    try {
        const { title, description, category, location, imageUrl, aiAnalysis, severity } = req.body;

        // AI analysis logic would go here or be passed from frontend
        // For now, we accept what's passed or default it

        const newReport = new Report({
            title: title || `${category} issue`,
            description,
            category,
            severity,
            location,
            imageUrl,
            aiAnalysis,
            reportedBy: req.user.id, // Assumes auth middleware populates req.user
        });

        const savedReport = await newReport.save();
        res.status(201).json({ success: true, report: savedReport });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all reports (Admin filters applied via query)
export const getAllReports = async (req, res) => {
    try {
        const { status, category, severity } = req.query;
        let filter = {};

        if (status) filter.status = status;
        if (category) filter.category = category;
        if (severity) filter.severity = severity;

        const reports = await Report.find(filter)
            .populate("reportedBy", "username email role")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get public reports (Community feed)
export const getPublicReports = async (req, res) => {
    try {
        const reports = await Report.find({})
            .populate("reportedBy", "username email role")
            .sort({ createdAt: -1 });

        const reportIds = reports.map((r) => r._id);
        const votes = await Vote.find({ user: req.user.id, report: { $in: reportIds } }).select("report");
        const votedSet = new Set(votes.map((v) => v.report.toString()));

        const severityVotes = await SeverityVote.find({ user: req.user.id, report: { $in: reportIds } }).select("report severity");
        const severityMap = new Map(severityVotes.map((v) => [v.report.toString(), v.severity]));

        const payload = reports.map((r) => ({
            ...r.toObject(),
            hasUpvoted: votedSet.has(r._id.toString()),
            severityVotes: r.severityVotes || { low: 0, medium: 0, high: 0, critical: 0 },
            userSeverityVote: severityMap.get(r._id.toString()) || null,
        }));

        res.status(200).json({ success: true, reports: payload });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get reports by User
export const getUserReports = async (req, res) => {
    try {
        const reports = await Report.find({ reportedBy: req.user.id })
            .sort({ createdAt: -1 });

        const reportIds = reports.map((r) => r._id);
        const severityVotes = await SeverityVote.find({ user: req.user.id, report: { $in: reportIds } }).select("report severity");
        const severityMap = new Map(severityVotes.map((v) => [v.report.toString(), v.severity]));

        const payload = reports.map((r) => ({
            ...r.toObject(),
            severityVotes: r.severityVotes || { low: 0, medium: 0, high: 0, critical: 0 },
            userSeverityVote: severityMap.get(r._id.toString()) || null,
        }));

        res.status(200).json({ success: true, reports: payload });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single report
export const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate("reportedBy", "username email role");

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        const hasUpvoted = await Vote.exists({ report: report._id, user: req.user.id });
        const severityVote = await SeverityVote.findOne({ report: report._id, user: req.user.id }).select("severity");
        res.status(200).json({
            success: true,
            report: {
                ...report.toObject(),
                hasUpvoted: !!hasUpvoted,
                severityVotes: report.severityVotes || { low: 0, medium: 0, high: 0, critical: 0 },
                userSeverityVote: severityVote?.severity || null,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Report Status (Admin)
export const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolutionProofUrl, department } = req.body;

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        if (status) report.status = status;

        if (status === "Resolved") {
            report.resolution = {
                proofImageUrl: resolutionProofUrl,
                resolvedAt: new Date(),
                notes: req.body.notes
            }
        }

        if (status === "Rejected") {
            report.resolution = {
                proofImageUrl: resolutionProofUrl,
                resolvedAt: new Date(),
                notes: req.body.notes || "Rejected"
            }
        }

        if (department) {
            report.assignedTo = { ...report.assignedTo, department };
        }

        const updatedReport = await report.save();

        if (status) {
            await Notification.create({
                user: report.reportedBy,
                type: "report_status",
                message: `Your report is now ${status}.`,
                data: { reportId: report._id, status },
            });
        }
        res.status(200).json({ success: true, report: updatedReport });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Report Statistics (Admin)
export const getReportStats = async (req, res) => {
    try {
        const totalReports = await Report.countDocuments();
        const pending = await Report.countDocuments({ status: "Open" });
        const inProgress = await Report.countDocuments({ status: "In Progress" });
        const resolved = await Report.countDocuments({ status: "Resolved" });
        const rejected = await Report.countDocuments({ status: "Rejected" });

        // Group by Category
        const byCategory = await Report.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                total: totalReports,
                pending,
                inProgress,
                resolved,
                rejected,
                byCategory
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Comments
export const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.length > 200) {
            return res.status(400).json({ success: false, message: "Comment must be 1-200 characters" });
        }

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        const comment = await Comment.create({
            report: report._id,
            author: req.user.id,
            text,
        });

        report.commentCount += 1;
        await report.save();

        await Notification.create({
            user: report.reportedBy,
            type: "report_comment",
            message: "Someone commented on your report.",
            data: { reportId: report._id, commentId: comment._id },
        });

        res.status(201).json({ success: true, comment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getComments = async (req, res) => {
    try {
        const comments = await Comment.find({ report: req.params.id })
            .populate("author", "username email")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, comments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Votes
export const toggleVote = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        const existing = await Vote.findOne({ report: report._id, user: req.user.id });
        if (existing) {
            await existing.deleteOne();
            report.upvotes = Math.max(0, report.upvotes - 1);
            await report.save();
            return res.status(200).json({ success: true, hasUpvoted: false, upvotes: report.upvotes });
        }

        await Vote.create({ report: report._id, user: req.user.id });
        report.upvotes += 1;
        await report.save();
        return res.status(200).json({ success: true, hasUpvoted: true, upvotes: report.upvotes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Severity Votes
export const voteSeverity = async (req, res) => {
    try {
        const { severity } = req.body;
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        const severityMap = {
            low: "Low",
            medium: "Medium",
            high: "High",
            critical: "Critical",
        };

        const normalized = severityMap[String(severity || "").toLowerCase()] || severity;
        if (!Object.values(severityMap).includes(normalized)) {
            return res.status(400).json({ success: false, message: "Invalid severity" });
        }

        if (!report.severityVotes) {
            report.severityVotes = { low: 0, medium: 0, high: 0, critical: 0 };
        }

        const existing = await SeverityVote.findOne({ report: report._id, user: req.user.id });
        const newKey = normalized.toLowerCase();

        if (existing) {
            if (existing.severity === normalized) {
                return res.status(200).json({
                    success: true,
                    severityVotes: report.severityVotes,
                    userSeverityVote: existing.severity,
                });
            }
            const oldKey = existing.severity.toLowerCase();
            if (report.severityVotes[oldKey] > 0) {
                report.severityVotes[oldKey] -= 1;
            }
            existing.severity = normalized;
            await existing.save();
        } else {
            await SeverityVote.create({ report: report._id, user: req.user.id, severity: normalized });
        }

        report.severityVotes[newKey] = (report.severityVotes[newKey] || 0) + 1;
        await report.save();

        return res.status(200).json({
            success: true,
            severityVotes: report.severityVotes,
            userSeverityVote: normalized,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
