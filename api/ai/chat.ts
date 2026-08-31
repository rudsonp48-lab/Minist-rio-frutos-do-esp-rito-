import { GoogleGenAI } from "@google/genai";
import { generateContextualTheologyFallback, ChatMessage } from "../../src/services/theologyEngine";

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

  const { messages = [] } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

  if (apiKey && Array.isArray(messages) && messages.length > 0) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const contents = messages.map((m: ChatMessage) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction:
            "Você é o Conselheiro e Mentor Bíblico Ecclesia IA. Ofereça respostas gentis, sábias, biblicamente fundamentadas e acolhedoras. Use versículos relevantes quando oportuno e formate as respostas com clareza em Markdown.",
          temperature: 0.7,
        },
      });

      const text = response.text || "";
      if (text.trim()) {
        return res.status(200).json({ response: text });
      }
    } catch (err: any) {
      console.warn("[Vercel API /chat] Gemini chat failed:", err?.message || err);
    }
  }

  const lastUserMsg = messages?.slice().reverse().find((m: any) => m.role === "user")?.content || "Dúvida bíblica";
  const fallback = generateContextualTheologyFallback({ mode: "chat", prompt: lastUserMsg });
  return res.status(200).json({ response: fallback });
}
