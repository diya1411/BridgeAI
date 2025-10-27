import express from "express";

const router = express.Router();

router.post("/summarize", async (req, res) => {
  const { text, role } = req.body;
  if (!text || !role) return res.status(400).json({ error: "Missing text or role" });

  try {
    const API_KEY = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Summarize the following text for a ${role}: "${text}"` }]
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Google AI Error:", data);
      return res.status(500).json({ error: "Failed to generate summary", details: data });
    }

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "No summary generated";
    res.json({ summary });
  } catch (err) {
    console.error("Google AI Error:", err);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

export default router;


