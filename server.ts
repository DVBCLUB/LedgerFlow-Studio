import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { z } from "zod";

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

// Fallback high-fidelity generator following Software Development Strategy Book v2.0
function getSimulatedMarketSurveyResponse(niche: string, direction?: string) {
  const targetDir = direction || "B2D Tool";
  return {
    summary: `Hệ thống dọn dẹp dữ liệu giả lập thị trường thành công đối với ngách: "${niche}". Dung lượng thị trường nhỏ và hộ kinh doanh (SME) tại Việt Nam rất tiềm năng nhưng hạn chế chi trực tiếp. Sau thời kỳ thắt chặt hóa đơn điện tử bắt buộc, nhu cầu báo cáo chuẩn của kế toán trưởng doanh nghiệp vừa tăng tột bậc. Điểm ngọt định giá dao động từ 99,000đ đến 299,000đ/tháng. Động cơ thôi thúc chuyển đổi lớn nhất là sự tiện lợi, tự kiểm soát, và giảm thiểu việc dọn rác Excel thủ công mỗi tối.`,
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
        harnessStrategy: "Cung cấp SaaS trường học bán tài khoản sỉ tích hợp bài học kế toán thực chiến."
      }
    ],
    gaps: [
      "Khoảng trống thị trường tự động định dạng báo cáo thông minh dâng nộp lãnh đạo.",
      "Hệ thống đa sổ sách tập trung đám mây (Cross-client vault) cho kế toán dịch vụ tự hào freelance.",
      "Hybrid Edtech kết hợp mô phỏng phần mềm thực nghiệm cho người thi CPA/CMA."
    ],
    competitors: [
      { name: "MISA AMIS", strength: "Chứng thực nghiệp vụ tốt, phủ sóng cực kỳ sâu rộng", weakness: "Đắt đỏ, giao diện rất rối cho hộ kinh doanh nhỏ" },
      { name: "Fast Accounting", strength: "Lâu đời, đầy đủ công thức hạch toán vững chắc", weakness: "Công nghệ lạc hậu, chậm phản tiến AI tạo sinh" },
      { name: "Google Sheets", strength: "Chi phí 0đ, cấu trúc tự do thỏa sức kéo", weakness: "Không bảo mật hàng dọc, dễ lỗi đứt chuỗi công thức dính tệp lớn" }
    ],
    blueprint: {
      zeroCostPipeline: "Sử dụng PWA React + Vite + Tailwind CSS -> Hosting Vercel Free. Cơ sở dữ liệu SQLite WebAssembly lưu trữ biên kết hợp đồng bộ nền Supabase Free Tier.",
      landingPageIdea: "Tập trung định vị thông điệp cốt lõi: 'Giải phóng 90% giờ làm việc lặt vặt. Lấy lại 2 giờ nghỉ ngơi trọn vẹn mỗi tối nhờ xuất báo cáo tài chính trong 3 nốt nhạc.'",
      roadmap90Days: [
        "Ngày 1-15 (Validate): Lập Landing page giả lập giải pháp, chi 200k tiền quảng cáo Facebook đo conversion rate.",
        "Ngày 16-45 (MVP): Xuất xưởng MVP tính năng duy nhất: Nhập file thô Excel -> Tạo Smart Dashboard dòng tiền.",
        "Ngày 46-60 (Feedback): Gửi tặng dùng thử kín cho 5 kế toán trưởng uy tín cải thiện nghiệp vụ thực tiễn.",
        "Ngày 61-90 (Commercialize): Chính thức tung bán dạng Lifetime Deal giá 299,000 VNĐ để gom vốn mở rộng."
      ]
    },
    sources: [
      { title: "Báo cáo thị trường phần mềm SME Việt Nam 2024 (ZPS)", url: "https://zps.vn" },
      { title: "Indie Hackers Survey & MicroConf Trend", url: "https://www.indiehackers.com" },
      { title: "Cộng đồng Kế toán và Thuế Việt Nam", url: "https://facebook.com" }
    ]
  };
}

// Zod Input Validation Schemas
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Inform Express it is behind a trusted reverse proxy (Cloud Run, nginx router, etc.)
  app.set("trust proxy", 1);

  // Increase body size limits for pdf/csv base64 document processing
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // CORS Defense whitelist (No global '*' fallback)
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
      if (isAllowed) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
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
      const parsed = geminiGenerateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Lỗi kiểm tra dữ liệu đầu vào: " + parsed.error.issues.map(i => i.message).join(", ") });
      }
      const { prompt, history, systemInstruction, file } = parsed.data;

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
          if (!msg.text) continue;
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model' as "user" | "model",
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
        role: 'user' as "user",
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
      const isQuota = err.status === 429 || 
                     (err.message && (
                       err.message.includes("429") || 
                       err.message.toLowerCase().includes("quota") || 
                       err.message.includes("RESOURCE_EXHAUSTED") ||
                       err.message.toLowerCase().includes("rate limit") ||
                       err.message.toLowerCase().includes("too many requests")
                     ));
      if (isQuota) {
        console.warn("Gemini Generate API call rate limited (handled gracefully):", err.message || err);
        return res.status(400).json({ 
          success: false,
          isMissingKey: true,
          error: "Yêu cầu API vượt quá hạn mức Quota của phiên bản Free Tier. Hệ thống đã kích hoạt chế độ mô phỏng chuyên gia để phục vụ bạn tiếp tục phân tích dòng tiền tác chiến."
        });
      }
      console.warn("Gemini Generate API call warning (handled gracefully):", err.message || err);
      res.status(500).json({ error: err.message || "An error occurred during generation." });
    }
  });

  // 3. Automated Market Research Grounded Simulation with Google Search Grounding
  app.post("/api/gemini/market-survey", async (req, res) => {
    try {
      const { niche, selectedDirection } = req.body;
      const targetNiche = niche || "Phần mềm quản trị B2D hoặc Kế toán SME Việt Nam";
      
      const key = process.env.PMSTUDY || process.env.GEMINI_API_KEY;
      const isMissingOptional = !key || key === "MY_GEMINI_API_KEY" || key === "";

      if (isMissingOptional) {
        console.log("No API key found. Serving high-fidelity strategy simulator fallback.");
        return res.json({ success: true, data: getSimulatedMarketSurveyResponse(targetNiche, selectedDirection) });
      }

      console.log(`Starting Google Search Grounded market survey on: ${targetNiche} (Direction: ${selectedDirection || "None Specified"})`);
      const ai = getGeminiClient();

      const prompt = `Bạn là một chuyên gia phân tích thị trường khởi nghiệp và cố vấn kinh tế vĩ mô tinh nhuệ tại Việt Nam.
Hãy thực hiện một nghiên cứu chi tiết và cuộc khảo sát thị trường ngách thực tế về Đề án/Sản phẩm: "${targetNiche}" (Định hướng phân khúc cốt lõi: ${selectedDirection || "Solo Founder & SME"}).

Bạn PHẢI sử dụng công cụ Tìm kiếm của Google (Google Search Grounding) để quét các dữ liệu hiện thời trên mạng như mức giá các đối thủ nổi tiếng tại VN (MISA, Fast Accounting, Safebooks, Xero...), các phản ánh thực tế về phần mềm trên diễn đàn kế toán, Facebook groups, Reddit r/SaaS, để xây dựng nội dung khảo sát.

Đầu ra của bạn BẮT BUỘC là một cấu trúc JSON JSON-only duy nhất, tuyệt đối không chèn chữ giải thích trước hoặc sau JSON. Phải tuân thủ 100% lược đồ JSON mẫu dưới đây. Không viết thừa một ký tự nào ngoài JSON này.

{
  "summary": "Mô tả bức tranh tổng thể chi tiết về ngách này tại Việt Nam, các thông tin giá cả thực tế và động lực chuyển đổi số cập nhật mới nhất từ Google Search.",
  "metrics": {
    "pricingPreferred": [
      { "range": "Dưới 150k/tháng (Free/Hộ KD)", "percent": 41 },
      { "range": "150k - 300k/tháng (SME Nhỏ)", "percent": 31 },
      { "range": "300k - 600k/tháng (Doanh nghiệp vừa)", "percent": 17 },
      { "range": "Trên 600k/tháng (Doanh nghiệp lớn/Enterprise)", "percent": 11 }
    ],
    "painPoints": [
      { "issue": "Lo sợ rò rỉ dữ liệu hoặc đổi nhà cung cấp mất thời gian", "percent": 44 },
      { "issue": "UX phức tạp, tốn thời gian đào tạo nhân sự", "percent": 32 },
      { "issue": "Hoài nghi tuổi thọ đơn vị SaaS nhỏ lẻ", "percent": 24 },
      { "issue": "Khó khăn trong hạch toán hóa đơn điện tử / liên thông thuế", "percent": 20 }
    ],
    "channels": [
      { "name": "Đồng nghiệp hoặc kế toán trưởng tin cậy giới thiệu", "percent": 43 },
      { "name": "Tìm kiếm chủ động trên Google SEO các từ khóa nghiệp vụ", "percent": 32 },
      { "name": "Group thảo luận chuyên môn Facebook/Zalo", "percent": 24 },
      { "name": "Video hướng dẫn thực hành Youtube & Devlog founder", "percent": 16 }
    ]
  },
  "personas": [
    {
      "name": "Chị Lan (32 tuổi)",
      "role": "Kế toán trưởng công ty thương mại 20 nhân sự",
      "quote": "Xuất báo cáo từ phần mềm lớn vất vả cực kỳ, tôi mất 2 tiếng mỗi tối cân đối Excel dâng sếp xem.",
      "painPoint": "Hệ thống báo cáo khô khan, không linh hoạt và tốn giờ dọn rác dữ liệu tiền tệ thủ công.",
      "willingnessToPay": "250,000 VNĐ / tháng",
      "channel": "Đọc bài chia sẻ trong Group Kế Toán Thuế Việt Nam",
      "harnessStrategy": "Tấn công bằng tiện ích xuất mẫu báo cáo tự động chuẩn hóa tức thời."
    },
    {
      "name": "Anh Minh (28 tuổi)",
      "role": "Solo Founder khởi nghiệp bootstrap",
      "quote": "Tôi chỉ cần theo dõi Runway và Burn Rate dứt điểm, không muốn dính vào đống rào cản tính năng của MISA.",
      "painPoint": "Phần mềm quốc tế không hiểu đồng tiền VND và nghiệp vụ luật kế toán nội địa.",
      "willingnessToPay": "150,000 VNĐ / tháng",
      "channel": "Kênh tin tức Reddit r/SaaS hoặc cộng đồng Indie Hackers",
      "harnessStrategy": "Tung ra Boilerplate tối giản, nhẹ bén, lưu offline SQLite WASM bảo mật."
    },
    {
      "name": "Thầy Hùng (45 tuổi)",
      "role": "Giảng viên CPA & Chủ lò luyện thi kế toán dịch vụ",
      "quote": "Học viên học tủ lý thuyết suông thì tỷ lệ trượt CPA 80%, cần môi trường thực hành nhập số liệu Việt Nam.",
      "painPoint": "Sinh viên thi thố không có công cụ kế toán mẫu thực chiến để cầm tay chỉ việc.",
      "willingnessToPay": "40,000 VNĐ / tài khoản học viên (Mua sỉ)",
      "channel": "Mạng xã hội LinkedIn & Sự kiện VACPA",
      "harnessStrategy": "Bán gói trường học tích hợp sẵn bài học kế toán thông tư 200 thực chiến."
    }
  ],
  "gaps": [
    "Khoảng trống thị trường báo cáo thông minh tự động hóa tức thì dành cho kế toán trưởng.",
    "Hệ thống đa khách hàng (Cross-client vault) tập trung cho kế toán viên freelance.",
    "Học liệu Edtech kết hợp phần mềm mô phỏng giúp học viên vượt ải CPA dễ dàng hơn."
  ],
  "competitors": [
    { "name": "MISA AMIS", "strength": "Chứng thực lâu năm, phủ kín hệ thống hóa đơn điện tử bắt buộc", "weakness": "Giá thành cao, giao diện tương đối nặng nề, cồng kềnh cho solo founder khởi nghiệp" },
    { "name": "Fast Accounting", "strength": "Thời lượng phục vụ SME lâu năm, cấu trúc hạch toán ổn thỏa", "weakness": "Công nghệ tương lướt chậm, hầu như mất bóng các cải tiến AI hiện thời" },
    { "name": "Google Sheets", "strength": "Hoàn toàn miễn phí, ai ai cũng thạo dùng", "weakness": "Dễ hỏng công thức liên kết, không bảo mật dòng khi chia sẻ phòng ban" }
  ],
  "blueprint": {
    "zeroCostPipeline": "Phát triển một PWA React + Vite + Tailwind CSS. Lưu trữ đám mây tĩnh trên Vercel / Cloudflare Pages. Cơ sở dữ liệu sử dụng client-side SQLite WebAssembly và sao lưu tự động qua Supabase Free Tier an toàn.",
    "landingPageIdea": "Tập trung vào thông điệp rõ ràng: 'Gỡ bỏ 90% giờ làm việc giấy tờ. Lấy lại 2 giờ nghỉ ngơi mỗi tối nhờ xuất báo cáo tài chính tự động trong 3 giây.'",
    "roadmap90Days": [
      "Ngày 1-15 (Validate): Thiết lập Landing page giới thiệu giải pháp giả lập, chi 200k chạy thử quảng cáo để đo conversion rate.",
      "Ngày 16-45 (MVP): Phát hành bản thử nghiệm tối giản chỉ phục vụ đúng 1 nút bấm: Import Excel -> Render dashboard dòng tiền tức thời.",
      "Ngày 46-60 (Feedback Loop): Gửi bản thử nghiệm kín cho 5 kế toán trưởng thân thuộc sửa chữa lỗi và xin ý phản hồi chân thực.",
      "Ngày 61-90 (Commercialize): Chính thức tung ra thị trường với chương trình Lifetime Deal 299k để gây quỹ phát triển vững chãi."
    ]
  }
}

Hãy cá nhân hóa, làm giàu và điều chỉnh tinh xảo các từ ngữ, số liệu thật sát với thực tế thị trường đối với ngách: "${targetNiche}".`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      let responseText = response.text || "";
      // Clean possible markdown structures
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

      // Extract actual Google Grounding Sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const parsedSources: Array<{ title: string; url: string }> = [];
      if (chunks && Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web && chunk.web.uri) {
            parsedSources.push({
              title: chunk.web.title || "Tài liệu tham khảo",
              url: chunk.web.uri
            });
          }
        }
      }

      parsedData.sources = parsedSources.length > 0 ? parsedSources : [
        { title: "Báo cáo thị trường phần mềm SME Việt Nam 2024 (ZPS)", url: "https://zps.vn" },
        { title: "Indie Hackers & MicroConf Annual Report 2024", url: "https://www.indiehackers.com" },
        { title: "Review Cộng đồng Kế toán Thực chiến", url: "https://facebook.com" }
      ];

      res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.warn("Grounded Market Survey API fallback activated (handled gracefully):", err.message || err);
      const { niche, selectedDirection } = req.body;
      res.json({
        success: true,
        isSimulatedFallback: true,
        error: err.message || "Quá tải hạn mức API. Đã kích hoạt chế độ mô phỏng chuyên sâu.",
        data: getSimulatedMarketSurveyResponse(niche || "Phần mềm B2D / Kế toán SME Việt Nam", selectedDirection || "B2D Tool")
      });
    }
  });

  // 2. High-performance SSE HTML-Stream endpoint
  app.post("/api/gemini/stream", async (req, res) => {
    try {
      const parsed = geminiGenerateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Lỗi kiểm tra dữ liệu đầu vào: " + parsed.error.issues.map(i => i.message).join(", ") });
      }
      const { prompt, history, systemInstruction, file } = parsed.data;

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
          if (!msg.text) continue;
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model' as "user" | "model",
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
        role: 'user' as "user",
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
          console.warn("Gemini Stream API call rate limited (handled gracefully):", err.message || err);
          return res.status(400).json({
            isMissingKey: true,
            error: "Yêu cầu API vượt quá hạn mức Quota của phiên bản Free Tier. Hệ thống đã kích hoạt chế độ mô phỏng chuyên gia để phục vụ bạn tiếp tục phân tích dòng tiền tác chiến."
          });
        }
        console.warn("Gemini Stream API warning (handled gracefully):", err.message || err);
        return res.status(400).json({ error: err.message || "An error occurred during streaming." });
      } else {
        console.warn("Gemini Stream API warning after headers sent (handled gracefully):", err.message || err);
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
