
import express from "express";
import {
	createReport,
	getAllReports,
	getUserReports,
	updateReportStatus,
	getReportStats,
	getPublicReports,
	getReportById,
	addComment,
	getComments,
	toggleVote,
	voteSeverity
} from "../controllers/reportController.js";
import { verifyToken, verifyAdmin, verifyRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected Routes
router.post("/create", verifyToken, createReport);
router.get("/user", verifyToken, getUserReports);
router.get("/public", verifyToken, getPublicReports);

// Admin Routes
router.get("/all", verifyToken, verifyAdmin, getAllReports);
router.get("/stats", verifyToken, verifyRole("admin", "authority"), getReportStats);
router.patch("/:id/status", verifyToken, verifyRole("admin", "authority"), updateReportStatus);

router.get("/:id", verifyToken, getReportById);
router.get("/:id/comments", verifyToken, getComments);
router.post("/:id/comments", verifyToken, addComment);
router.post("/:id/vote", verifyToken, toggleVote);
router.post("/:id/severity-vote", verifyToken, voteSeverity);

export default router;
