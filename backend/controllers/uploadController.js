import { uploadToCloudinary } from "../utils/cloudinaryUploader.js";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const filename = `${Date.now()}-${req.file.originalname}`;
    const result = await uploadToCloudinary(req.file.buffer, filename);

    return res.status(200).json({
      success: true,
      imageUrl: result.secure_url,
      cloudinaryId: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
