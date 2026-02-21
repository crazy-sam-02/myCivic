import express from "express";
import multer from "multer";
import { uploadImage } from "../controllers/uploadController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/image", verifyToken, upload.single("image"), uploadImage);

export default router;
