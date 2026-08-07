import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel, Modality, GenerateVideosOperation } from "@google/genai";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize Gemini Client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Helper to format AI errors with quota/rate-limit awareness
function formatAiError(err: any, defaultMsg: string): string {
  const msg = err?.message || defaultMsg;
  if (
    msg.includes("Quota exceeded") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("free_tier") ||
    err?.status === 429
  ) {
    return "Gemini API quota or rate limit reached for this feature. Please wait a few seconds before retrying or ensure a paid API key is selected in settings.";
  }
  if (
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("experiencing high demand")
  ) {
    return "The Gemini AI service is currently experiencing high temporary demand. Automatic retries were attempted. Please wait a moment and try again.";
  }
  return msg;
}

// Robust fallback execution helper for generateContent
async function generateWithModelFallback(
  ai: any,
  preferredModel: string,
  baseConfig: any,
  contents: any
): Promise<{ response: any; usedModel: string }> {
  const modelsToTry = [
    preferredModel,
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
  ].filter((m, index, self) => self.indexOf(m) === index);

  let lastError: any = null;

  for (const model of modelsToTry) {
    const currentConfig = { ...baseConfig };

    // Clean up model-specific properties if falling back from pro
    if (model !== "gemini-3.1-pro-preview") {
      delete currentConfig.thinkingConfig;
    }
    if (model === "gemini-3.1-flash-lite") {
      delete currentConfig.tools; // flash-lite does not support googleSearch or googleMaps grounding
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: currentConfig,
        });
        if (response?.text) {
          return { response, usedModel: model };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || "";
        const isQuota =
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("Quota exceeded") ||
          errMsg.includes("free_tier");

        if (isQuota) {
          console.warn(`Model ${model} hit quota/rate limit. Immediately failing over to next model...`);
          break; // Immediately fail over to next model without waiting/retrying same model
        }

        const isTransient503 =
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("experiencing high demand");

        if (isTransient503 && attempt < 2) {
          console.warn(`Transient 503 error on model ${model} (attempt ${attempt}). Retrying in 1.2s...`);
          await new Promise((resolve) => setTimeout(resolve, 1200));
        } else {
          console.warn(`Model ${model} failed (attempt ${attempt}): ${errMsg}. Trying next fallback model...`);
          break; // proceed to next model
        }
      }
    }
  }

  throw lastError || new Error("All AI models are currently experiencing high demand. Please try again shortly.");
}

// API route for decision analysis
app.post("/api/analyze-decision", async (req, res) => {
  try {
    const {
      title,
      context,
      options,
      analysisType,
      includeDevilsAdvocate,
      enableThinking,
      useFastModel,
      enableSearch,
      enableMaps,
      mediaAttachments, // Array of { data: base64, mimeType: string }
    } = req.body;

    if (!title || !options || !Array.isArray(options) || options.length < 1) {
      return res.status(400).json({ error: "Title and at least one option are required." });
    }

    const ai = getAiClient();

    // Model selection strategy based on user settings
    let selectedModel = "gemini-3.6-flash";
    const config: any = {
      temperature: 0.3,
      responseMimeType: "application/json",
    };

    if (enableThinking) {
      selectedModel = "gemini-3.1-pro-preview";
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    } else if (useFastModel) {
      selectedModel = "gemini-3.1-flash-lite";
    } else if (enableSearch) {
      selectedModel = "gemini-3.5-flash";
      config.tools = [{ googleSearch: {} }];
    } else if (enableMaps) {
      selectedModel = "gemini-3.5-flash";
      config.tools = [{ googleMaps: {} }];
    }

    const optionsListStr = options.map((opt: string, idx: number) => `Option ${idx + 1}: "${opt}"`).join("\n");
    const promptText = `You are "The Tiebreaker", an elite AI decision strategist and analytical consultant.
Analyse the following decision scenario and provide structured evaluations:

DECISION TITLE / QUESTION:
"${title}"

ADDITIONAL CONTEXT & PRIORITIES:
"${context || "No extra context provided."}"

OPTIONS TO CONSIDER:
${optionsListStr}

ANALYSIS REQUESTED: ${analysisType || "all"}
DEVIL'S ADVOCATE INCLUDED: ${includeDevilsAdvocate ? "Yes" : "No"}
GROUNDING ENABLED: ${enableSearch ? "Search Grounding" : enableMaps ? "Maps Grounding" : "None"}

Please return a comprehensive, balanced, objective, and deeply insightful decision breakdown in valid JSON strictly matching the schema.
Ensure each pro and con has a realistic weight (1-5 scale) reflecting importance.
Include 4 to 6 comparison criteria that matter most for this type of decision.
If SWOT analysis is requested or 'all', provide Strengths, Weaknesses, Opportunities, and Threats for each option.
Provide a clear "verdict" with a winning option or recommended synthesis, confidence score (0-100), key factors, when to choose alternative options, a devil's advocate blind spot challenge, and a gut-check reflection question.`;

    // Handle Multimodal attachments (images, video, audio)
    let contentsInput: any = promptText;
    if (mediaAttachments && Array.isArray(mediaAttachments) && mediaAttachments.length > 0) {
      const parts: any[] = [{ text: promptText }];
      mediaAttachments.forEach((att: any) => {
        if (att.data && att.mimeType) {
          parts.push({
            inlineData: {
              data: att.data,
              mimeType: att.mimeType,
            },
          });
        }
      });
      contentsInput = { parts };
    }

    config.responseSchema = {
      type: Type.OBJECT,
      properties: {
        decisionTitle: { type: Type.STRING },
        context: { type: Type.STRING },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        prosCons: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              optionName: { type: Type.STRING },
              summary: { type: Type.STRING },
              pros: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    weight: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                  },
                  required: ["id", "text", "weight"],
                },
              },
              cons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    weight: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                  },
                  required: ["id", "text", "weight"],
                },
              },
            },
            required: ["optionName", "summary", "pros", "cons"],
          },
        },
        comparisonCriteria: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              importance: { type: Type.NUMBER },
              scores: {
                type: Type.OBJECT,
                description: "Key-value pair mapping option name to score 1-10",
                properties: {},
              },
              notes: {
                type: Type.OBJECT,
                description: "Key-value pair mapping option name to reasoning note",
                properties: {},
              },
            },
            required: ["id", "name", "importance"],
          },
        },
        swotAnalyses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              optionName: { type: Type.STRING },
              swot: {
                type: Type.OBJECT,
                properties: {
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  threats: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["strengths", "weaknesses", "opportunities", "threats"],
              },
            },
            required: ["optionName", "swot"],
          },
        },
        verdict: {
          type: Type.OBJECT,
          properties: {
            winner: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            verdictSummary: { type: Type.STRING },
            keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            whenToChooseWinner: { type: Type.STRING },
            whenToChooseAlternative: { type: Type.STRING },
            devilsAdvocatePoint: { type: Type.STRING },
            gutCheckQuestion: { type: Type.STRING },
          },
          required: [
            "winner",
            "confidenceScore",
            "verdictSummary",
            "keyFactors",
            "whenToChooseWinner",
            "whenToChooseAlternative",
            "devilsAdvocatePoint",
            "gutCheckQuestion",
          ],
        },
      },
      required: ["decisionTitle", "options", "prosCons", "verdict"],
    };

    const { response, usedModel } = await generateWithModelFallback(
      ai,
      selectedModel,
      config,
      contentsInput
    );

    if (!response.text) {
      throw new Error("Empty response returned from AI model.");
    }

    const parsedData = JSON.parse(response.text);

    // Extract grounding sources if search or maps were enabled
    let groundingSources: any[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && Array.isArray(chunks)) {
      groundingSources = chunks.map((c: any) => ({
        title: c.web?.title || c.maps?.title || "Grounding Source",
        uri: c.web?.uri || c.maps?.uri || "#",
      }));
    }

    return res.json({
      ...parsedData,
      groundingSources,
      usedModel,
    });
  } catch (error: any) {
    console.error("Error analyzing decision:", error);
    return res.status(500).json({
      error: formatAiError(error, "Failed to generate decision analysis. Please try again."),
    });
  }
});

// API route for quick tiebreaker question / quick advice
app.post("/api/quick-tiebreaker", async (req, res) => {
  try {
    const { optionA, optionB, tiebreakerCriteria } = req.body;
    if (!optionA || !optionB) {
      return res.status(400).json({ error: "Option A and Option B are required." });
    }

    const ai = getAiClient();
    const prompt = `Fast tiebreaker decision:
Option A: "${optionA}"
Option B: "${optionB}"
Key Priority / Focus: "${tiebreakerCriteria || "Overall value and long-term satisfaction"}"

Provide a swift, decisive tiebreaker result with:
1. Winner (Option A, Option B, or specific condition)
2. Main reason in 2 concise sentences
3. The #1 trade-off you accept if you choose the winner
4. A quick 10-second gut-check test.`;

    const { response } = await generateWithModelFallback(
      ai,
      "gemini-3.1-flash-lite",
      {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winner: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            acceptedTradeoff: { type: Type.STRING },
            gutCheckTest: { type: Type.STRING },
          },
          required: ["winner", "reasoning", "acceptedTradeoff", "gutCheckTest"],
        },
      },
      prompt
    );

    const result = JSON.parse(response.text || "{}");
    return res.json(result);
  } catch (err: any) {
    console.error("Quick tiebreaker error:", err);
    return res.status(500).json({ error: formatAiError(err, "Failed to run quick tiebreaker.") });
  }
});

// ==========================================
// 3. TRANSCRIBE AUDIO ENDPOINT (gemini-3.5-flash)
// ==========================================
app.post("/api/transcribe-audio", async (req, res) => {
  try {
    const { audioData, mimeType } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "Audio data is required for transcription." });
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: audioData,
              mimeType: mimeType || "audio/webm",
            },
          },
          { text: "Transcribe the spoken audio text clearly and accurately. Return only the transcript." },
        ],
      },
    });

    return res.json({ transcript: response.text?.trim() || "" });
  } catch (err: any) {
    console.error("Transcription error:", err);
    return res.status(500).json({ error: formatAiError(err, "Failed to transcribe audio.") });
  }
});

// ==========================================
// 4. ANALYZE IMAGE OR VIDEO ENDPOINT (gemini-3.1-pro-preview)
// ==========================================
app.post("/api/analyze-media", async (req, res) => {
  try {
    const { mediaData, mimeType, prompt } = req.body;
    if (!mediaData || !mimeType) {
      return res.status(400).json({ error: "Media data and mimeType are required." });
    }

    const ai = getAiClient();
    const userPrompt = prompt || "Analyze this media content to extract key facts, options, pros, and cons to assist in a decision.";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: mediaData,
              mimeType,
            },
          },
          { text: userPrompt },
        ],
      },
    });

    return res.json({ analysis: response.text || "" });
  } catch (err: any) {
    console.error("Media analysis error:", err);
    return res.status(500).json({ error: formatAiError(err, "Failed to analyze media.") });
  }
});

// ==========================================
// 5. GENERATE OPTION VISUAL IMAGE (gemini-3.1-flash-lite-image / gemini-3.1-flash-image)
// ==========================================
app.post("/api/generate-option-image", async (req, res) => {
  try {
    const { prompt, aspectRatio, quality } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required to generate an image." });
    }

    const ai = getAiClient();
    const validAspectRatios = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];
    const targetAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

    const preferredModel = quality === "4K" ? "gemini-3-pro-image" : (quality === "HD" ? "gemini-3.1-flash-image" : "gemini-3.1-flash-lite-image");
    
    // Model fallback sequence for image generation
    const modelsToTry = [
      preferredModel,
      "gemini-3.1-flash-image",
      "gemini-3.1-flash-lite-image",
      "gemini-3-pro-image",
    ].filter((m, idx, self) => self.indexOf(m) === idx);

    let response: any = null;
    let lastErr: any = null;

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                text: `High quality concept illustration of decision scenario: ${prompt}`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: targetAspectRatio,
              ...(model === "gemini-3-pro-image" ? { imageSize: "4K" } : {}),
            },
          },
        });
        if (response) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Image model ${model} failed (${err?.message || "unknown"}). Trying next fallback...`);
      }
    }

    if (!response && lastErr) {
      throw lastErr;
    }

    let imageUrl = "";
    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No image data returned from generation model.");
    }

    return res.json({ imageUrl });
  } catch (err: any) {
    const errMsg = String(err?.message || err || "");
    const isQuota =
      errMsg.includes("429") ||
      errMsg.includes("RESOURCE_EXHAUSTED") ||
      errMsg.includes("Quota exceeded") ||
      errMsg.includes("quota");

    if (isQuota) {
      console.log("Gemini Image API free-tier quota reached. Returning curated concept fallback visual.");
      // Curated conceptual stock image fallbacks from Unsplash
      const fallbackImages = [
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
      ];
      const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
      return res.json({
        imageUrl: randomFallback,
        warning: "Gemini Image API quota reached on free tier. Displaying conceptual preview fallback photo.",
      });
    }

    console.error("Image generation error:", err);
    return res.status(500).json({ error: formatAiError(err, "Failed to generate image.") });
  }
});

// ==========================================
// 6. VEO 3 VIDEO GENERATION ENDPOINTS (veo-3.1-lite-generate-preview)
// ==========================================
app.post("/api/veo/start", async (req, res) => {
  try {
    const { prompt, imageBytes, mimeType, aspectRatio } = req.body;
    const ai = getAiClient();

    const targetAspectRatio = aspectRatio === "9:16" ? "9:16" : "16:9";

    const payload: any = {
      model: "veo-3.1-lite-generate-preview",
      prompt: prompt || "A cinematic preview of this decision outcome",
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: targetAspectRatio,
      },
    };

    if (imageBytes && mimeType) {
      payload.image = {
        imageBytes,
        mimeType,
      };
    }

    try {
      const operation = await ai.models.generateVideos(payload);
      return res.json({ operationName: operation.name });
    } catch (veoErr: any) {
      const errMsg = String(veoErr?.message || veoErr || "");
      const isQuota =
        errMsg.includes("429") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("Quota exceeded") ||
        errMsg.includes("quota");

      if (isQuota) {
        console.log("Veo 3 Video API free-tier quota reached. Returning sample outcome video fallback.");
        const fallbackVideo = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
        return res.json({
          isQuotaFallback: true,
          videoUrl: fallbackVideo,
          warning: "Veo 3 AI Video API quota limit reached on free tier. Displaying conceptual outcome simulation video.",
        });
      }
      console.warn("Veo video generation error details:", veoErr?.message);
      throw veoErr;
    }
  } catch (err: any) {
    const errMsg = String(err?.message || err || "");
    const isQuota =
      errMsg.includes("429") ||
      errMsg.includes("RESOURCE_EXHAUSTED") ||
      errMsg.includes("Quota exceeded") ||
      errMsg.includes("quota");

    if (isQuota) {
      console.log("Veo 3 Video API free-tier quota reached in outer handler. Returning sample outcome video fallback.");
      const fallbackVideo = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
      return res.json({
        isQuotaFallback: true,
        videoUrl: fallbackVideo,
        warning: "Veo 3 AI Video API quota limit reached on free tier. Displaying conceptual outcome simulation video.",
      });
    }

    console.error("Veo start error:", err);
    return res.status(500).json({ error: formatAiError(err, "Failed to start video generation.") });
  }
});

app.post("/api/veo/status", async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) return res.status(400).json({ error: "operationName is required" });

    const ai = getAiClient();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    return res.json({ done: updated.done });
  } catch (err: any) {
    console.error("Veo status error:", err);
    return res.status(500).json({ error: err.message || "Failed to check video status." });
  }
});

app.post("/api/veo/download", async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) return res.status(400).json({ error: "operationName is required" });

    const ai = getAiClient();
    const apiKey = process.env.GEMINI_API_KEY!;
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(400).json({ error: "Video URI not available yet." });
    }

    const videoRes = await fetch(uri, {
      headers: { "x-goog-api-key": apiKey },
    });

    res.setHeader("Content-Type", "video/mp4");
    const arrayBuffer = await videoRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error("Veo download error:", err);
    return res.status(500).json({ error: err.message || "Failed to download generated video." });
  }
});

// ==========================================
// 7. LYRIA MUSIC GENERATION ENDPOINT (lyria-3-clip-preview / lyria-3-pro-preview)
// ==========================================
app.post("/api/lyria/generate", async (req, res) => {
  try {
    const { prompt, fullLength } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required for music generation." });

    const ai = getAiClient();
    const model = fullLength ? "lyria-3-pro-preview" : "lyria-3-clip-preview";

    const response = await ai.models.generateContentStream({
      model,
      contents: `Generate a decision soundtrack: ${prompt}`,
    });

    let audioBase64 = "";
    let lyrics = "";
    let mimeType = "audio/wav";

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    return res.json({ audioBase64, lyrics, mimeType });
  } catch (err: any) {
    console.error("Lyria music generation error:", err);
    return res.status(500).json({ error: formatAiError(err, "Failed to generate music.") });
  }
});

// ==========================================
// 8. GEMINI CHAT DECISION COACH ENDPOINT
// ==========================================
app.post("/api/chat-advisor", async (req, res) => {
  try {
    const { messages, decisionTitle, context } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getAiClient();
    const systemInstruction = `You are "The Tiebreaker AI Decision Coach". You help users explore dilemmas, weigh options, resolve cognitive biases, and think clearly.
Active Decision Title: "${decisionTitle || "General Dilemma"}"
Context: "${context || "None"}"
Keep responses supportive, analytical, structured, and action-oriented.`;

    // Filter messages to ensure first turn is 'user' and format roles as 'user' | 'model'
    const firstUserIdx = messages.findIndex((m: any) => m.sender === "user");
    const validMessages = firstUserIdx !== -1 ? messages.slice(firstUserIdx) : messages;

    const contents = validMessages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.content || "" }],
    }));

    const { response, usedModel } = await generateWithModelFallback(
      ai,
      "gemini-3.1-pro-preview",
      { systemInstruction },
      contents
    );

    return res.json({ reply: response?.text || "I'm here to help with your decision. Could you elaborate or rephrase?", usedModel });
  } catch (err: any) {
    console.error("Chat advisor error:", err);
    return res.status(500).json({ error: formatAiError(err, "Failed to get chat advice.") });
  }
});

async function startServer() {
  const server = http.createServer(app);

  // Attach WebSocket server for Gemini Live API real-time voice counseling with noServer: true
  const wss = new WebSocketServer({ noServer: true });

  wss.on("error", (err) => {
    console.error("WSS error:", err);
  });

  let viteDevServer: any = null;

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    viteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteDevServer.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Explicit HTTP Upgrade handling for WebSocket routes & Vite HMR
  server.on("upgrade", (request, socket, head) => {
    try {
      const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
      if (url.pathname === "/live") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      } else if (viteDevServer && viteDevServer.ws) {
        viteDevServer.ws.handleUpgrade(request, socket, head);
      } else {
        socket.destroy();
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      socket.destroy();
    }
  });

  wss.on("connection", async (clientWs) => {
    clientWs.on("error", (err) => {
      console.error("Client WS error:", err);
    });

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        if (clientWs.readyState === 1) { // WebSocket.OPEN
          clientWs.send(JSON.stringify({ error: "GEMINI_API_KEY is not configured." }));
          clientWs.close();
        }
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction:
            "You are 'The Tiebreaker' real-time voice decision advisor. Engage in a natural, empathetic, and sharp dialogue with the user to help them talk through their decision.",
        },
        callbacks: {
          onmessage: (message) => {
            if (clientWs.readyState !== 1) return;
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onerror: (err: any) => {
            console.error("Live API session error:", err);
            if (clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ error: err?.message || "Live voice session error" }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === 1) {
              clientWs.close();
            }
          },
        },
      });

      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (err) {
          console.error("Live API WS message error:", err);
        }
      });

      clientWs.on("close", () => {
        try {
          session.close();
        } catch (_) {}
      });
    } catch (err: any) {
      console.error("Live connection error:", err);
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify({ error: err.message }));
        clientWs.close();
      }
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`The Tiebreaker server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
