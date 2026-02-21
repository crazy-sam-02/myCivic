import { Notification } from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    notification.readAt = new Date();
    await notification.save();
    return res.status(200).json({ success: true, notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
