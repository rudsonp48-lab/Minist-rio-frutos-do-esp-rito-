import { GoogleGenAI, Modality } from "@google/genai";

interface CachedTtsEntry {
  audioUrl: string;
  voiceName: string;
  modelName: string;
}

const ttsMemoryCache = new Map<string, CachedTtsEntry>();
const MAX_CACHE_ENTRIES = 80;

function setTtsCache(key: string, value: CachedTtsEntry) {
  if (ttsMemoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = ttsMemoryCache.keys().next().value;
    if (oldestKey) ttsMemoryCache.delete(oldestKey);
  }
  ttsMemoryCache.set(key, value);
}

function wrapPcm24kToWav(pcmBuffer: Buffer, sampleRate = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

const VALID_VOICES = ["Orus", "Puck", "Charon", "Fenrir", "Aoede", "Kore", "Zephyr"];

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { text, voice = "Orus" } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Text is required for speech synthesis" });
  }

  const cleanText = text
    .replace(/#+\s/g, "")
    .replace(/[*_`]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[-*]\s+/g, "")
    .trim()
    .slice(0, 1800);

  const selectedVoice = VALID_VOICES.includes(voice) ? voice : "Orus";
  const cacheKey = `${selectedVoice}:${cleanText.toLowerCase()}`;

  const cached = ttsMemoryCache.get(cacheKey);
  if (cached) {
    return res.status(200).json({
      audioUrl: cached.audioUrl,
      mimeType: "audio/wav",
      source: "gemini-neural-tts-cache",
      voiceName: cached.voiceName,
      model: cached.modelName,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  if (apiKey) {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const expressivePrompt =
      `Leia o texto a seguir em português do Brasil com voz humana natural, fluida e expressiva, ` +
      `com entonação vocal realista, dinâmica de leitura, respiração e pausas suaves na pontuação, ` +
      `sem soar robótico ou apressado:\n\n${cleanText}`;

    const ttsModels = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"];
    for (const modelName of ttsModels) {
      try {
        const ttsResponse = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: expressivePrompt }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
            },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Gemini TTS timeout")), 9000)
          ),
        ]);

        const inlineData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
          const rawBuffer = Buffer.from(inlineData.data, "base64");
          const mime = (inlineData.mimeType || "").toLowerCase();
          const isRiffWav =
            rawBuffer.length > 12 &&
            rawBuffer.toString("ascii", 0, 4) === "RIFF" &&
            rawBuffer.toString("ascii", 8, 12) === "WAVE";

          const finalBuffer =
            isRiffWav || mime.includes("wav") ? rawBuffer : wrapPcm24kToWav(rawBuffer, 24000);
          const audioUrl = `data:audio/wav;base64,${finalBuffer.toString("base64")}`;

          setTtsCache(cacheKey, { audioUrl, voiceName: selectedVoice, modelName });
          return res.status(200).json({
            audioUrl,
            mimeType: "audio/wav",
            source: "gemini-neural-tts",
            voiceName: selectedVoice,
            model: modelName,
          });
        }
      } catch (err: any) {
        console.warn(`[Vercel API /ai/tts] Model ${modelName} failed:`, err?.message || err);
      }
    }
  }

  return res.status(200).json({
    fallback: true,
    message: "Client humanized speech engine activated",
  });
}
