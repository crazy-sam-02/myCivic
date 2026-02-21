import express from "express";
import { getNotifications, markNotificationRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getNotifications);
router.patch("/:id/read", markNotificationRead);

export default router;
