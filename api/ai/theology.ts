import { GoogleGenAI } from "@google/genai";
import { buildTheologyPrompts, generateContextualTheologyFallback, TheologyRequest } from "../../src/services/theologyEngine";

export default async function handler(req: any, res: any) {
  // Support CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const payload: TheologyRequest = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const { systemInstruction, userPrompt } = buildTheologyPrompts(payload);

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || "";
      if (text.trim()) {
        return res.status(200).json({ result: text, source: "gemini" });
      }
    } catch (err: any) {
      console.warn("[Vercel API /theology] Gemini generation failed:", err?.message || err);
    }
  }

  // Resilient fallback
  const fallback = generateContextualTheologyFallback(payload);
  return res.status(200).json({ result: fallback, source: "curated-theology" });
}
