import dotenv from "dotenv";
import { InferenceClient } from "@huggingface/inference";

dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;
const MODEL_ID = "google/gemma-3-27b-it:featherless-ai";

const client = new InferenceClient(HF_TOKEN);

export const describeImage = async (req, res) => {
  try {
    const { imageUrl, hint } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "imageUrl is required" });
    }
    if (!HF_TOKEN) {
      return res.status(500).json({ success: false, message: "HF_TOKEN not configured" });
    }

    const promptText = `Describe the civic issue in this image concisely in one sentence.${hint ? ` Hint: ${hint}` : ""}`;

    const chatCompletion = await client.chatCompletion({
      model: MODEL_ID,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptText,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 150,
    });

    const description = chatCompletion.choices[0].message.content || "";
    return res.status(200).json({ success: true, description: description.trim() });

  } catch (error) {
    console.error("AI Describe Error:", error);
    // Fallback to avoid crashing the frontend flow completely
    return res.status(200).json({
      success: true,
      description: "Image captured. Please add a detailed description manually."
    });
  }
};

export const summarizeText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: "Text is required" });
    }
    if (!HF_TOKEN) {
      return res.status(500).json({ success: false, message: "HF_TOKEN not configured" });
    }

    const promptText = `Summarize the following civic issue report into a concise, 1-sentence title or description: "${text}"`;

    const chatCompletion = await client.chatCompletion({
      model: MODEL_ID,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptText,
            }
          ]
        },
      ],
      max_tokens: 100,
    });

    const summary = chatCompletion.choices[0].message.content || "";
    return res.status(200).json({ success: true, summary: summary.trim() });

  } catch (error) {
    console.error("AI Summarize Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const categorizeImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "imageUrl is required" });
    }
    if (!HF_TOKEN) {
      return res.status(500).json({ success: false, message: "HF_TOKEN not configured" });
    }

    const categories = ['Streetlights', 'Roads & Infrastructure', 'Waste Management', 'Water Supply', 'Other'];
    const promptText = `Analyze this civic issue image and categorize it into ONE of these categories only: ${categories.join(', ')}. Reply with ONLY the category name, nothing else.`;

    const chatCompletion = await client.chatCompletion({
      model: MODEL_ID,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptText,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    });

    let category = chatCompletion.choices[0].message.content?.trim() || "Other";
    
    // Validate the category is in the allowed list
    if (!categories.includes(category)) {
      category = "Other";
    }

    return res.status(200).json({ success: true, category });

  } catch (error) {
    console.error("AI Categorize Error:", error);
    // Fallback to "Other" category
    return res.status(200).json({
      success: true,
      category: "Other"
    });
  }
};
