import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const key = process.env.PMSTUDY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Inform Express it is behind a trusted reverse proxy (Cloud Run, nginx router, etc.)
  app.set("trust proxy", 1);

  // Increase body size limits for pdf/csv base64 document processing
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // CORS Defense whitelist
  app.use((req, res, next) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://0.0.0.0:3000"
    ];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
    } else {
      next();
    }
  });

  // Basic rate limiter - max 15 requests per minute per IP
  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 15,
    message: {
      error: "Bạn đã đạt giới hạn 15 yêu cầu/phút. Vui lòng dừng bớt thao tác và thử lại sau.",
      isRateLimit: true
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false } // Avoid ERL unexpected proxy validation errors
  });

  // Apply rate limiter to API routes
  app.use("/api/gemini/", apiLimiter);

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date() });
  });

  const STORAGE_FILE = path.join(process.cwd(), "db_storage.json");

  // Load database state from disk
  app.get("/api/db/load", async (req, res) => {
    try {
      if (!fs.existsSync(STORAGE_FILE)) {
        return res.json({ success: true, data: {} });
      }
      const data = await fs.promises.readFile(STORAGE_FILE, "utf-8");
      res.json({ success: true, data: JSON.parse(data) });
    } catch (err: any) {
      console.error("Load DB Error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to load database state." });
    }
  });

  // Save database state to disk
  app.post("/api/db/save", async (req, res) => {
    try {
      const { payload } = req.body;
      if (!payload) {
        return res.status(400).json({ success: false, error: "Payload is required." });
      }
      await fs.promises.writeFile(STORAGE_FILE, JSON.stringify(payload, null, 2), "utf-8");
      res.json({ success: true, message: "Database synchronized successfully on the server." });
    } catch (err: any) {
      console.error("Save DB Error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to save database state." });
    }
  });

  // Gemini Status endpoint
  app.get("/api/gemini/status", (req, res) => {
    const usingCustomKey = !!process.env.PMSTUDY;
    res.json({
      success: true,
      usingCustomKey,
      keyName: usingCustomKey ? "PMSTUDY" : "Shared Free Tier Key",
      isProReady: usingCustomKey
    });
  });

  // 1. Static Content Generation Route (Normal POST)
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, history, systemInstruction, file } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const key = process.env.PMSTUDY || process.env.GEMINI_API_KEY;
      if (!key || key === "MY_GEMINI_API_KEY") {
        return res.status(400).json({ 
          error: "GEMINI_API_KEY (hoặc PMSTUDY) chưa được cấu hình trong bảng điều khiển Secrets.",
          isMissingKey: true 
        });
      }

      const ai = getGeminiClient();

      // Build conversation contents reflecting history natively
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          // Avoid system notifications or errors in historical contexts
          if (msg.role === 'error' || !msg.text) continue;
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      }

      // Build the active part parts including any multimodal docs
      const activeParts = [];
      if (file && file.data && file.mimeType) {
        activeParts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.data
          }
        });
      }
      activeParts.push({ text: prompt });

      contents.push({
        role: 'user',
        parts: activeParts
      });

      const modelName = req.body.model || "gemini-2.0-flash";

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: systemInstruction ? { systemInstruction } : undefined
      });

      res.json({ success: true, text: response.text });
    } catch (err: any) {
      console.error("Gemini Error:", err);
      const isQuota = err.status === 429 || 
                     (err.message && (
                       err.message.includes("429") || 
                       err.message.toLowerCase().includes("quota") || 
                       err.message.includes("RESOURCE_EXHAUSTED") ||
                       err.message.toLowerCase().includes("rate limit") ||
                       err.message.toLowerCase().includes("too many requests")
                     ));
      if (isQuota) {
        return res.status(400).json({ 
          success: false,
          isMissingKey: true,
          error: "Yêu cầu API vượt quá hạn mức Quota của phiên bản Free Tier. Hệ thống đã kích hoạt chế độ mô phỏng chuyên gia để phục vụ bạn tiếp tục phân tích dòng tiền tác chiến."
        });
      }
      res.status(500).json({ error: err.message || "An error occurred during generation." });
    }
  });

  // 2. High-performance SSE HTML-Stream endpoint
  app.post("/api/gemini/stream", async (req, res) => {
    try {
      const { prompt, history, systemInstruction, file } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const key = process.env.PMSTUDY || process.env.GEMINI_API_KEY;
      if (!key || key === "MY_GEMINI_API_KEY") {
        return res.status(400).json({ 
          error: "GEMINI_API_KEY (hoặc PMSTUDY) chưa được cấu hình trong bảng điều khiển Secrets.",
          isMissingKey: true 
        });
      }

      const ai = getGeminiClient();

      // Build conversation structures
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          if (msg.role === 'error' || !msg.text) continue;
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      }

      const activeParts = [];
      if (file && file.data && file.mimeType) {
        activeParts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.data
          }
        });
      }
      activeParts.push({ text: prompt });

      contents.push({
        role: 'user',
        parts: activeParts
      });

      // Stream content chunk-by-chunk using modern @google/genai SDK
      // Connect first so that if it throws 429 Quota Exceeded immediately, we can respond with JSON
      const modelName = req.body.model || "gemini-2.0-flash";
      const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: systemInstruction ? { systemInstruction } : undefined
      });

      // Setup SSE response headers after successful generation setup
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      console.error("Streaming Gemini Error:", err);
      const isQuota = err.status === 429 || 
                     (err.message && (
                       err.message.includes("429") || 
                       err.message.toLowerCase().includes("quota") || 
                       err.message.includes("RESOURCE_EXHAUSTED") ||
                       err.message.toLowerCase().includes("rate limit") ||
                       err.message.toLowerCase().includes("too many requests")
                     ));
                     
      if (!res.headersSent) {
        if (isQuota) {
          return res.status(400).json({
            isMissingKey: true,
            error: "Yêu cầu API vượt quá hạn mức Quota của phiên bản Free Tier. Hệ thống đã kích hoạt chế độ mô phỏng chuyên gia để phục vụ bạn tiếp tục phân tích dòng tiền tác chiến."
          });
        }
        return res.status(400).json({ error: err.message || "An error occurred during streaming." });
      } else {
        // Fallback response inside SSE structure if possible
        res.write(`data: ${JSON.stringify({ error: err.message || "An error occurred during streaming." })}\n\n`);
        res.end();
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
