import { Comment } from "../models/Comment.js";
import { Report } from "../models/Report.js";
import User from "../models/user.js";

// Get all comments for a report
export const getCommentsByReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const comments = await Comment.find({ report: reportId })
      .populate("author", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add a comment (all users)
export const addComment = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Comment text must be less than 500 characters",
      });
    }

    // Check if report exists
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const comment = new Comment({
      report: reportId,
      author: userId,
      text: text.trim(),
    });

    const savedComment = await comment.save();
    const populatedComment = await savedComment.populate("author", "username email");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a comment (admin or comment author)
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user is the comment author or admin
    if (comment.author.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this comment",
      });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update comment text (only by author or admin)
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Comment text must be less than 500 characters",
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.author.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this comment",
      });
    }

    comment.text = text.trim();
    const updatedComment = await comment.save();
    const populatedComment = await updatedComment.populate("author", "username email");

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all comments (admin only)
export const getAllComments = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all comments",
      });
    }

    const comments = await Comment.find()
      .populate("author", "username email")
      .populate("report", "title description")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
