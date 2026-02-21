import express from "express";
import { describeImage, summarizeText, categorizeImage } from "../controllers/aiController.js";

const router = express.Router();

router.post("/describe", describeImage);
router.post("/summarize", summarizeText);
router.post("/categorize", categorizeImage);

export default router;
