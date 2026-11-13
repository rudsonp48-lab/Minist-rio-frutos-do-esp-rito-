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

      let startIndex = 0;
      while (startIndex < messages.length && messages[startIndex]?.role === "assistant") {
        startIndex++;
      }
      const validMessages = messages.slice(startIndex);

      if (validMessages.length > 0) {
        const contents = validMessages.map((m: ChatMessage) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: String(m.content || "") }],
        }));

        const candidateModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
        for (const modelName of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
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
          } catch (modelErr: any) {
            console.warn(`[Vercel API /chat] Model ${modelName} failed:`, modelErr?.message || modelErr);
          }
        }
      }
    } catch (err: any) {
      console.warn("[Vercel API /chat] Gemini chat failed:", err?.message || err);
    }
  }

  const lastUserMsg = messages?.slice().reverse().find((m: any) => m.role === "user")?.content || "Dúvida bíblica";
  const fallback = generateContextualTheologyFallback({ mode: "chat", prompt: lastUserMsg });
  return res.status(200).json({ response: fallback });
}
