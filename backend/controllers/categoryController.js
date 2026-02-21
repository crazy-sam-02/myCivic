import { Category } from "../models/Category.js";

export const getCategories = async (_req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, department } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: "Name and slug are required" });
    }

    const category = await Category.create({ name, slug, description, department });
    return res.status(201).json({ success: true, category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
