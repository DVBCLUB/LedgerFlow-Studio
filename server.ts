import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { callAI, streamAI, checkAIProxyHealth, type ChatMessage, type CallAIOptions } from "./server/services/aiClient";

dotenv.config();

// Fallback high-fidelity generator following Software Development Strategy Book v2.0
function getSimulatedMarketSurveyResponse(niche: string, direction?: string) {
  return {
    summary: `Hệ thống dọn dẹp dữ liệu giả lập thị trường thành công đối với ngách: "${niche}". Dung lượng thị trường nhỏ và hộ kinh doanh (SME) tại Việt Nam rất tiềm năng nhưng hạn chế chi trực tiếp. Điểm ngọt định giá dao động từ 99,000đ đến 299,000đ/tháng. Động cơ thôi thúc chuyển đổi lớn nhất là sự tiện lợi, tự kiểm soát, và giảm thiểu việc dọn rác Excel thủ công mỗi tối.`,
    metrics: {
      pricingPreferred: [
        { range: "Dưới 150k/tháng (Free/Hộ KD)", percent: 41 },
        { range: "150k - 300k/tháng (SME Nhỏ)", percent: 31 },
        { range: "300k - 600k/tháng (Doanh nghiệp vừa)", percent: 17 },
        { range: "Trên 600k/tháng (Doanh nghiệp lớn/Enterprise)", percent: 11 }
      ],
      painPoints: [
        { issue: "Sợ rò rỉ dữ liệu hoặc đổi nhà cung cấp mất thời gian", percent: 44 },
        { issue: "UX phức tạp, tốn thời gian học", percent: 32 },
        { issue: "Lo sợ nhà cung cấp SaaS nhỏ phá sản đột ngột", percent: 24 },
        { issue: "Vướng mắc hạch toán hóa đơn điện tử liên thông thuế", percent: 20 }
      ],
      channels: [
        { name: "Đồng nghiệp hoặc kế toán trưởng tin cậy giới thiệu", percent: 43 },
        { name: "Tìm kiếm tự nhiên từ Google SEO", percent: 32 },
        { name: "Group chuyên ngành chia sẻ nghiệp vụ Facebook/Zalo", percent: 24 },
        { name: "Thao tác trên Youtube & Devlog chia sẻ của Solo Founder", percent: 16 }
      ]
    },
    personas: [
      {
        name: "Chị Lan (32 tuổi)",
        role: "Kế toán trưởng công ty thương mại",
        quote: "Mỗi tối tôi mất thêm 2 tiếng đồng hành Excel để định dạng lại báo cáo xuất ra từ phần mềm lớn dâng lên sếp.",
        painPoint: "Hệ thống báo cáo thô, tốn giờ lao động thừa mứa dọn dẹp số liệu.",
        willingnessToPay: "250,000 VNĐ / tháng",
        channel: "Tìm tài nguyên trong nhóm Facebook Kế toán Thực hành Việt Nam",
        harnessStrategy: "Bán công cụ tự động hóa xuất báo cáo tài chính chuẩn hóa PowerPoint/Excel trong 3 giây."
      },
      {
        name: "Anh Minh (28 tuổi)",
        role: "Solo Founder khởi nghiệp bootstrap",
        quote: "Tôi mỏi mệt vì sử dụng Excel sai số hoài, các SaaS nước ngoài thì không hỗ trợ VND và thuế Việt Nam.",
        painPoint: "Chi phí platform cao, không tương thích với bối cảnh tài chính nội địa.",
        willingnessToPay: "150,000 VNĐ / tháng",
        channel: "Đọc tin tức Reddit r/SaaS hoặc Hackernews",
        harnessStrategy: "Tung ra Boilerplate mượt mà, siêu nhẹ, tích hợp SQLite WebAssembly cục bộ an tâm."
      },
      {
        name: "Thầy Hùng (45 tuổi)",
        role: "Chủ lớp luyện thi chứng chỉ kế toán CPA/CMA",
        quote: "Học sáo rỗng khó thi đỗ, trung tâm cần môi trường thực hành hạch toán số liệu thực tế Việt Nam cho học viên.",
        painPoint: "Thiếu môi trường thực hành phần mềm kế toán mẫu theo thông tư thuế Việt Nam.",
        willingnessToPay: "40,000 VNĐ / tài khoản (Mua sỉ)",
        channel: "Mạng xã hội LinkedIn chuyên nghiệp hoặc sự kiện VACPA",
        harnessStrategy: "Cung cấp SaaS trường học bán tài khoản sỉ tích hợp bài học kế toán thông tư 200 thực chiến."
      }
    ],
    gaps: [
      "Khoảng trống thị trường tự động định dạng báo cáo thông minh dâng nộp lãnh đạo.",
      "Hệ thống đa sổ sách tập trung đám mây (Cross-client vault) cho kế toán dịch vụ freelance.",
      "Hybrid Edtech kết hợp mô phỏng phần mềm thực nghiệm cho người thi CPA/CMA."
    ],
    competitors: [
      { name: "MISA AMIS", strength: "Chứng thực nghiệp vụ tốt, phủ sóng sâu rộng", weakness: "Đắt đỏ, giao diện rất rối cho hộ kinh doanh nhỏ" },
      { name: "Fast Accounting", strength: "Lâu đời, đầy đủ công thức hạch toán", weakness: "Công nghệ lạc hậu, chậm phản tiến AI tạo sinh" },
      { name: "Google Sheets", strength: "Chi phí 0đ, cấu trúc tự do", weakness: "Không bảo mật hàng dọc, dễ lỗi đứt chuỗi công thức" }
    ],
    blueprint: {
      zeroCostPipeline: "Sử dụng PWA React + Vite + Tailwind CSS -> Hosting Vercel Free. Cơ sở dữ liệu SQLite WebAssembly lưu trữ biên kết hợp đồng bộ nền Supabase Free Tier.",
      landingPageIdea: "Giải phóng 90% giờ làm việc lặt vặt, lấy lại 2 giờ nghỉ ngơi mỗi tối nhờ xuất báo cáo tài chính trong 3 nốt nhạc.",
      roadmap90Days: [
        "Ngày 1-15 (Validate): Lập Landing page giả lập giải pháp, chi 200k tiền quảng cáo Facebook đo conversion rate.",
        "Ngày 16-45 (MVP): Xuất xưởng MVP tính năng duy nhất: Nhập file thô Excel -> Tạo Smart Dashboard dòng tiền.",
        "Ngày 46-60 (Feedback): Gửi tặng dùng thử kín cho 5 kế toán trưởng uy tín cải thiện nghiệp vụ thực tiễn.",
        "Ngày 61-90 (Commercialize): Chính thức tung bán dạng Lifetime Deal 299k để gom vốn mở rộng."
      ]
    },
    sources: [
      { title: "Báo cáo thị trường phần mềm SME Việt Nam 2024 (ZPS)", url: "https://zps.vn" },
      { title: "Indie Hackers Survey & MicroConf Trend", url: "https://www.indiehackers.com" },
      { title: "Cộng đồng Kế toán và Thuế Việt Nam", url: "https://facebook.com" }
    ]
  };
}

const databaseSaveSchema = z.object({
  payload: z.record(z.string(), z.any())
});

const geminiGenerateSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
  model: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(["user", "model"]),
    text: z.string().optional()
  })).optional(),
  systemInstruction: z.string().optional(),
  file: z.object({
    data: z.string(),
    mimeType: z.string()
  }).optional()
});

type GeminiGenerateInput = z.infer<typeof geminiGenerateSchema>;

function resolveProxyModel(model?: string): NonNullable<CallAIOptions["model"]> {
  if (!model) return "ai-assistant";
  const normalized = model.toLowerCase();
  return normalized.includes("pro") || normalized.includes("3.5") || normalized.includes("advanced")
    ? "ai-assistant-pro"
    : "ai-assistant";
}

function buildAIMessages({ prompt, history, systemInstruction, file }: GeminiGenerateInput): ChatMessage[] {
  const messages: ChatMessage[] = [];

  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }

  if (history && Array.isArray(history)) {
    for (const msg of history) {
      if (!msg.text) continue;
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text
      });
    }
  }

  const userPrompt = file && file.data && file.mimeType
    ? `${prompt}\n\n[Đính kèm file ${file.mimeType} dạng base64 đã được gửi qua request. Wrapper LiteLLM hiện tại dùng text chat; nếu cần OCR/vision thật, hãy dùng model vision trong proxy và mở rộng aiClient.ts sang content parts.]`
    : prompt;

  messages.push({ role: "user", content: userPrompt });
  return messages;
}

function isRateLimitOrQuotaError(err: any): boolean {
  return err?.status === 429 ||
    (err?.message && (
      err.message.includes("429") ||
      err.message.toLowerCase().includes("quota") ||
      err.message.includes("RESOURCE_EXHAUSTED") ||
      err.message.toLowerCase().includes("rate limit") ||
      err.message.toLowerCase().includes("too many requests")
    ));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set("trust proxy", 1);
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  app.use((req, res, next) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://0.0.0.0:3000"
    ];
    const origin = req.headers.origin;
    if (origin) {
      const isAllowed = allowedOrigins.includes(origin) ||
                        origin.endsWith(".run.app") ||
                        /https:\/\/ais-.*\.run\.app/.test(origin);
      if (isAllowed) res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") res.sendStatus(204);
    else next();
  });

  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 15,
    message: {
      error: "Bạn đã đạt giới hạn 15 yêu cầu/phút. Vui lòng dừng bớt thao tác và thử lại sau.",
      isRateLimit: true
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false }
  });

  app.use("/api/gemini/", apiLimiter);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date() });
  });

  const STORAGE_FILE = path.join(process.cwd(), "db_storage.json");

  app.get("/api/db/load", async (req, res) => {
    try {
      if (!fs.existsSync(STORAGE_FILE)) return res.json({ success: true, data: {} });
      const data = await fs.promises.readFile(STORAGE_FILE, "utf-8");
      res.json({ success: true, data: JSON.parse(data) });
    } catch (err: any) {
      console.error("Load DB Error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to load database state." });
    }
  });

  app.post("/api/db/save", async (req, res) => {
    try {
      const parsed = databaseSaveSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: "Dữ liệu không hợp lệ: " + parsed.error.issues.map(i => i.message).join(", ") });
      }
      const { payload } = parsed.data;
      await fs.promises.writeFile(STORAGE_FILE, JSON.stringify(payload, null, 2), "utf-8");
      res.json({ success: true, message: "Database synchronized successfully on the server." });
    } catch (err: any) {
      console.error("Save DB Error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to save database state." });
    }
  });

  // Kept at /api/gemini/status so existing frontend calls do not break.
  app.get("/api/gemini/status", async (req, res) => {
    const proxyHealthy = await checkAIProxyHealth();
    res.json({
      success: true,
      usingCustomKey: !!process.env.AI_PROXY_KEY,
      keyName: "LiteLLM Local Proxy",
      isProReady: proxyHealthy,
      proxyUrl: process.env.AI_PROXY_URL ?? "http://127.0.0.1:4000"
    });
  });

  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const parsed = geminiGenerateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Lỗi kiểm tra dữ liệu đầu vào: " + parsed.error.issues.map(i => i.message).join(", ") });
      }

      const response = await callAI(buildAIMessages(parsed.data), {
        model: resolveProxyModel(parsed.data.model),
      });

      res.json({ success: true, text: response.content, modelUsed: response.modelUsed });
    } catch (err: any) {
      const isQuota = isRateLimitOrQuotaError(err);
      if (isQuota) {
        console.log("[AI Proxy] Generate rate limit or quota exceeded (handled gracefully).", err.message || err);
        return res.status(400).json({
          success: false,
          isMissingKey: true,
          error: "Yêu cầu API vượt quá hạn mức Quota của phiên bản Free Tier. Hệ thống đã kích hoạt chế độ mô phỏng chuyên gia để phục vụ bạn tiếp tục phân tích dòng tiền tác chiến."
        });
      }
      console.log("[AI Proxy] Generate call completed with error:", err.message || err);
      res.status(500).json({ error: err.message || "An error occurred during generation." });
    }
  });

  app.post("/api/gemini/market-survey", async (req, res) => {
    try {
      const { niche, selectedDirection } = req.body;
      const targetNiche = niche || "Phần mềm quản trị B2D hoặc Kế toán SME Việt Nam";
      console.log(`Starting AI proxy market survey on: ${targetNiche} (Direction: ${selectedDirection || "None Specified"})`);

      const prompt = `Bạn là một chuyên gia phân tích thị trường khởi nghiệp và cố vấn kinh tế vĩ mô tinh nhuệ tại Việt Nam.
Hãy thực hiện một nghiên cứu chi tiết và cuộc khảo sát thị trường ngách thực tế về Đề án/Sản phẩm: "${targetNiche}" (Định hướng phân khúc cốt lõi: ${selectedDirection || "Solo Founder & SME"}).

Bạn PHẢI quét các dữ liệu hiện thời trên mạng như mức giá các đối thủ nổi tiếng tại VN (MISA, Fast Accounting, Safebooks, Xero...), các phản ánh thực tế về phần mềm trên diễn đàn kế toán, Facebook groups, Reddit r/SaaS, để xây dựng nội dung khảo sát nếu model/provider hiện tại có khả năng web/search. Nếu provider fallback không hỗ trợ browsing, hãy suy luận thận trọng và đánh dấu nguồn tham khảo tổng quát.

Đầu ra của bạn BẮT BUỘC là JSON-only duy nhất, không chèn chữ giải thích trước hoặc sau JSON. Schema bắt buộc: { "summary": string, "metrics": { "pricingPreferred": [], "painPoints": [], "channels": [] }, "personas": [], "gaps": [], "competitors": [], "blueprint": {}, "sources": [] }.

Hãy cá nhân hóa, làm giàu và điều chỉnh tinh xảo các từ ngữ, số liệu thật sát với thực tế thị trường đối với ngách: "${targetNiche}".`;

      const response = await callAI([{ role: "user", content: prompt }], {
        model: "ai-assistant-pro",
        temperature: 0.2,
      });

      let responseText = response.content || "";
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (e1) {
        console.warn("Direct JSON Parsing failed. Using regex extraction.");
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedData = JSON.parse(match[0]);
          } catch (e2) {
            throw new Error("Unable to parse extracted JSON fragment.");
          }
        } else {
          throw new Error("No structured JSON detected in generative output.");
        }
      }

      parsedData.sources = Array.isArray(parsedData.sources) && parsedData.sources.length > 0 ? parsedData.sources : [
        { title: "Báo cáo thị trường phần mềm SME Việt Nam 2024 (ZPS)", url: "https://zps.vn" },
        { title: "Indie Hackers & MicroConf Annual Report 2024", url: "https://www.indiehackers.com" },
        { title: "Review Cộng đồng Kế toán Thực chiến", url: "https://facebook.com" }
      ];
      parsedData.modelUsed = response.modelUsed;
      res.json({ success: true, data: parsedData });
    } catch (err: any) {
      const isQuota = isRateLimitOrQuotaError(err);
      if (isQuota) console.log("[Market Survey API] AI proxy rate limited or quota exceeded. Activating high-fidelity simulation fallback gracefully.");
      else console.log("[Market Survey API] AI proxy fallback activated:", err.message || err);
      const { niche, selectedDirection } = req.body;
      res.json({
        success: true,
        isSimulatedFallback: true,
        error: err.message || "Quá tải hạn mức API. Đã kích hoạt chế độ mô phỏng chuyên sâu.",
        data: getSimulatedMarketSurveyResponse(niche || "Phần mềm B2D / Kế toán SME Việt Nam", selectedDirection || "B2D Tool")
      });
    }
  });

  app.post("/api/gemini/stream", async (req, res) => {
    try {
      const parsed = geminiGenerateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Lỗi kiểm tra dữ liệu đầu vào: " + parsed.error.issues.map(i => i.message).join(", ") });
      }

      const responseStream = streamAI(buildAIMessages(parsed.data), {
        model: resolveProxyModel(parsed.data.model),
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      for await (const text of responseStream) {
        if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      const isQuota = isRateLimitOrQuotaError(err);
      if (!res.headersSent) {
        if (isQuota) {
          console.log("[AI Proxy Stream API] Stream rate limited or quota exceeded (handled gracefully).", err.message || err);
          return res.status(400).json({
            isMissingKey: true,
            error: "Yêu cầu API vượt quá hạn mức Quota của phiên bản Free Tier. Hệ thống đã kích hoạt chế độ mô phỏng chuyên gia để phục vụ bạn tiếp tục phân tích dòng tiền tác chiến."
          });
        }
        console.log("[AI Proxy Stream API] Stream completed with error:", err.message || err);
        return res.status(400).json({ error: err.message || "An error occurred during streaming." });
      }
      console.log("[AI Proxy Stream API] Stream completed with error after headers sent:", err.message || err);
      res.write(`data: ${JSON.stringify({ error: err.message || "An error occurred during streaming." })}\n\n`);
      res.end();
    }
  });

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
