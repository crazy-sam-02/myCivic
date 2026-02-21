import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/authMiddleware.js";
import { resolveReport, rejectReport, assignReport, getAllReports, getReportById } from "../controllers/adminController.js";

const router = express.Router();

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Middleware to verify admin/authority role
const verifyAdminRole = (req, res, next) => {
  const userRole = req.user?.role;
  if (!userRole || !["admin", "authority"].includes(userRole)) {
    return res.status(403).json({ success: false, message: "Access denied. Admin or Authority role required." });
  }
  next();
};

// Admin routes (all require authentication and admin/authority role)
router.get("/reports", verifyToken, verifyAdminRole, getAllReports);
router.get("/reports/:id", verifyToken, verifyAdminRole, getReportById);
router.post("/reports/:id/resolve", verifyToken, verifyAdminRole, upload.single("proofImage"), (req, res) => {
  req.body.reportId = req.params.id;
  resolveReport(req, res);
});
router.post("/reports/:id/reject", verifyToken, verifyAdminRole, (req, res) => {
  req.body.reportId = req.params.id;
  rejectReport(req, res);
});
router.post("/reports/:id/assign", verifyToken, verifyAdminRole, (req, res) => {
  req.body.reportId = req.params.id;
  assignReport(req, res);
});

export default router;
