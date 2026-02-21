import express from "express";
import { getCategories, createCategory } from "../controllers/categoryController.js";
import { verifyToken, verifyRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getCategories);
router.post("/", verifyToken, verifyRole("admin"), createCategory);

export default router;
