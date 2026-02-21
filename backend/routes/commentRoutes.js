import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  getCommentsByReport,
  addComment,
  deleteComment,
  updateComment,
  getAllComments,
} from "../controllers/commentController.js";

const router = express.Router();

// Get all comments for a report (accessible to all)
router.get("/report/:reportId", getCommentsByReport);

// Add a comment (requires authentication)
router.post("/report/:reportId", verifyToken, addComment);

// Update a comment (requires authentication, owner or admin)
router.put("/:commentId", verifyToken, updateComment);

// Delete a comment (requires authentication, owner or admin)
router.delete("/:commentId", verifyToken, deleteComment);

// Get all comments (admin only)
router.get("/", verifyToken, getAllComments);

export default router;
