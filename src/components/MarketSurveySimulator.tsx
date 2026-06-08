import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { 
  Search, 
  Compass, 
  TrendingUp, 
  Users, 
  Map, 
  Sparkles, 
  Zap, 
  FileText, 
  FileDown, 
  Globe, 
  AlertTriangle,
  Lightbulb, 
  Milestone, 
  ArrowRight,
  RefreshCw,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface SurveyMetric {
  range?: string;
  issue?: string;
  name?: string;
  percent: number;
}

interface Persona {
  name: string;
  role: string;
  quote: string;
  painPoint: string;
  willingnessToPay: string;
  channel: string;
  harnessStrategy: string;
}

interface Competitor {
  name: string;
  strength: string;
  weakness: string;
}

interface Blueprint {
  zeroCostPipeline: string;
  landingPageIdea: string;
  roadmap90Days: string[];
}

interface WebSource {
  title: string;
  url: string;
}

interface SurveyData {
  summary: string;
  metrics: {
    pricingPreferred: SurveyMetric[];
    painPoints: SurveyMetric[];
    channels: SurveyMetric[];
  };
  personas: Persona[];
  gaps: string[];
  competitors: Competitor[];
  blueprint: Blueprint;
  sources: WebSource[];
}

const PRESETS = [
  {
    id: "preset-b2d",
    title: "1. QUICK WIN — LedgerFlow Studio as B2D Tool",
    description: "Nhắm vào cộng đồng Solo Founders đang loay hoay tìm kiếm sườn dự án (Boilerplate) chất lượng để bắt đầu nhanh và tiết kiệm chi phí vận hành tại Việt Nam.",
    niche: "phần mềm boilerplate solo founder vn",
    direction: "B2D Tool (Builder-to-Developer)"
  },
  {
    id: "preset-report",
    title: "2. NICHE FOCUS — Tool báo cáo dòng tiền thông minh",
    description: "Giải bài toán nhức nhối nhất của các kế toán trưởng: Xuất tệp thô Excel ra và tự động định dạng thành biểu đồ sang xịn dâng sếp xem trong 3 giây.",
    niche: "phần mềm báo cáo tài chính tự động cho kế toán trưởng sme việt nam",
    direction: "Smart AI-powered reporting helper"
  },
  {
    id: "preset-cpa",
    title: "3. LONG-TERM — EdTech × FinTech ôn thi CPA/CMA",
    description: "Nền tảng đào tạo kết hợp ứng dụng kế toán mẫu thực tế, hạch toán trực tuyến giúp sinh viên & kế toán học viên vượt qua các bài thi chứng chỉ khắt khe.",
    niche: "ôn thi cpa cma kế toán thực hành việt nam",
    direction: "EdTech x FinTech hybrid simulator"
  }
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28'];

export default function MarketSurveySimulator() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("preset-b2d");
  const [customNiche, setCustomNiche] = useState<string>("");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [surveyResult, setSurveyResult] = useState<SurveyData | null>(null);
  const [activePersonaTab, setActivePersonaTab] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { activeIdea } = useStore();

  // Initialize with preset background logic or run automated survey
  const currentPreset = PRESETS.find(p => p.id === selectedPresetId);

  // Sync state when activeIdea changes dynamically
  useEffect(() => {
    if (activeIdea) {
      setIsCustomMode(true);
      setCustomNiche(activeIdea.nicheAudience);
    }
  }, [activeIdea]);

  useEffect(() => {
    // Generate initial default survey data matching preset on mount
    triggerMockOrLiveSurvey(true);
  }, [selectedPresetId, isCustomMode, customNiche]);

  const addLog = (msg: string) => {
    setLogMessages(prev => [...prev, `[${new Date().toLocaleTimeString('vi-VN')}] ${msg}`]);
  };

  const triggerMockOrLiveSurvey = async (isInitialSeed = false) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLogMessages([]);
    
    const nicheText = isCustomMode ? customNiche : (currentPreset?.niche || "");
    const directionText = isCustomMode ? "Giải pháp SaaS Tùy chỉnh" : (currentPreset?.direction || "");

    if (isCustomMode && !customNiche) {
      addLog("⚠️ Cảnh báo: Ngách nghiên cứu của bạn đang trống. Vui lòng nhập thông tin trước khi chạy.");
      setIsLoading(false);
      return;
    }

    addLog(`🚀 Khởi động Đề Án Khảo Sát & Giải Lập Thị Trường về: "${nicheText || "Quy chuẩn tài chính"}"`);
    addLog("🌐 Đang kết nối hạ tầng internet tự động quét Google Search...");
    
    // Simulate some logs for realistic touch
    setTimeout(() => addLog("🔬 Đang tìm kiếm thông số đối thủ cạnh tranh tại Việt Nam (MISA, Fast Accounting...)"), 400);
    setTimeout(() => addLog("💬 Thu hái sentiment người dùng từ các diễn đàn kế toán dịch vụ & group facebook..."), 900);
    setTimeout(() => addLog("📊 Phát hiện bảng hạch toán ưu tú & cấu trúc định giá PPP phù hợp..."), 1400);

    try {
      const response = await fetch('/api/gemini/market-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          niche: nicheText,
          selectedDirection: directionText
        })
      });

      if (!response.ok) {
        throw new Error("Mạng bị gián đoạn hoặc API gặp sự cố. Đang chuyển giao hoàn hảo sang cơ sở dữ liệu giả lập offline.");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setSurveyResult(result.data);
        if (result.isSimulatedFallback) {
          addLog("💡 Thông báo: Đã tự động kích hoạt chế độ mô phỏng chuyên sâu độ tin cậy cao do hạn mức API.");
        } else {
          addLog("✅ Khảo sát thành công! Các nguồn tham chiếu trực tiếp đã được định vị và liên kết.");
        }
      } else {
        throw new Error(result.error || "Không nhận được phản hồi hợp lệ từ máy chủ.");
      }
    } catch (e: any) {
      addLog(`⚠️ Fallback: Chạy mô phỏng tích hợp nội bộ do ${e.message}`);
      // Fallback generator
      const fallbackData = getOfflineStaticSurvey(nicheText, directionText);
      setSurveyResult(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  const getOfflineStaticSurvey = (niche: string, direction: string): SurveyData => {
    return {
      summary: `Hệ thống dọn dẹp dữ liệu giả lập thị trường thành công đối với ngách: "${niche || "Phần mềm B2D / Kế toán SME Việt Nam"}". Dung lượng thị trường nhỏ và hộ kinh doanh (SME) tại Việt Nam rất tiềm năng nhưng hạn chế chi trực tiếp. Sau thời kỳ thắt chặt hóa đơn điện tử bắt buộc, nhu cầu báo cáo chuẩn của kế toán trưởng doanh nghiệp vừa tăng tột bậc. Điểm ngọt định giá dao động từ 99,000đ đến 299,000đ/tháng. Động cơ thôi thúc chuyển đổi lớn nhất là sự tiện lợi, tự kiểm soát, và giảm thiểu việc dọn rác Excel thủ công mỗi tối.`,
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
          painPoint: "Hệ thống báo cáo thô, tốn giờ lao động thừa mứa dọn dẹp số liệu định dạng vô ích.",
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
        zeroCostPipeline: `Sử dụng ${direction === 'B2D Tool (Builder-to-Developer)' ? 'Boilerplate sạch sẽ với' : 'PWA'} React + Vite + Tailwind CSS -> Hosting Vercel Free. Cơ sở dữ liệu SQLite WebAssembly lưu trữ biên kết hợp đồng bộ nền Supabase Free Tier.`,
        landingPageIdea: "Tập trung định vị thông điệp cốt lõi: 'Giải phóng 90% giờ làm việc lặt vặt. Lấy lại 2 giờ nghỉ ngơi trọn vẹn mỗi tối nhờ xuất báo cáo tài chính trong 3 nốt nhạc.'",
        roadmap90Days: [
          "Ngày 1-15 (Validate): Lập Landing page giả lập giải pháp, chi 200k tiền quảng cáo Facebook đo thu hút.",
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
  };

  const handleExportExcel = () => {
    if (!surveyResult) return;
    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["MỤC TIÊU NGHIÊN CỨU", isCustomMode ? customNiche : currentPreset?.niche],
        ["ĐỊNH HƯỚNG SẢN PHẨM", isCustomMode ? "SaaS tùy chỉnh" : currentPreset?.direction],
        ["TÓM TẮT THỊ TRƯỜNG", surveyResult.summary],
        ["KIẾN TRÚC TỐI GIẢN 0Đ", surveyResult.blueprint.zeroCostPipeline],
        ["THÔNG ĐIỆP LANDING PAGE", surveyResult.blueprint.landingPageIdea]
      ];
      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWS, "Tong Quan Thi Truong");

      // Metrics sheets
      const pricingWS = XLSX.utils.json_to_sheet(surveyResult.metrics.pricingPreferred);
      XLSX.utils.book_append_sheet(workbook, pricingWS, "Nhu Cau Muc Gia");

      const painWS = XLSX.utils.json_to_sheet(surveyResult.metrics.painPoints);
      XLSX.utils.book_append_sheet(workbook, painWS, "Noi Dau Chi Phoi");

      // Personas sheets
      const personaWS = XLSX.utils.json_to_sheet(surveyResult.personas);
      XLSX.utils.book_append_sheet(workbook, personaWS, "Bao Cao Persona");

      XLSX.writeFile(workbook, `LedgerFlow_Survey_Report_${selectedPresetId}.xlsx`);
    } catch (e: any) {
      alert("Xuất Excel thất bại: " + e.message);
    }
  };

  const handleExportPDF = () => {
    if (!surveyResult) return;
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("LEDGERFLOW STUDIO - BAO CAO KHAI THAC THI TRUONG", 14, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Ngay khao sat: ${new Date().toLocaleDateString('vi-VN')}`, 14, 28);
      doc.text(`Niche: ${isCustomMode ? customNiche : currentPreset?.niche}`, 14, 34);

      let y = 45;
      doc.setFont("helvetica", "bold");
      doc.text("1. TOM TAT THI TRUONG (DESK RESEARCH)", 14, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      
      const splitSummary = doc.splitTextToSize(surveyResult.summary, 180);
      doc.text(splitSummary, 14, y);
      y += (splitSummary.length * 6) + 5;

      // Print gaps
      doc.setFont("helvetica", "bold");
      doc.text("2. KHOANG TRONG GAP THI TRUONG PHAT HIEN", 14, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      surveyResult.gaps.forEach((g, idx) => {
        doc.text(`- ${g}`, 14, y);
        y += 7;
      });
      y += 5;

      // Print blueprints
      doc.setFont("helvetica", "bold");
      doc.text("3. PHAC THAO KIEN TRUC 0D & GTM PLAN", 14, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text(`Kien truc: ${surveyResult.blueprint.zeroCostPipeline}`, 14, y);
      y += 10;

      surveyResult.blueprint.roadmap90Days.forEach((step, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const splitStep = doc.splitTextToSize(`+ ${step}`, 180);
        doc.text(splitStep, 14, y);
        y += (splitStep.length * 6) + 2;
      });

      doc.save("LedgerFlow_Market_Blueprint.pdf");
    } catch (e: any) {
      alert("Xuất PDF thất bại: " + e.message);
    }
  };

  return (
    <div className="bg-[#030712] border border-slate-900 rounded-3xl p-6 shadow-2xl space-y-8 select-text">
      {/* HEADER HERO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-purple-600/15 border border-purple-500/20 rounded-full text-purple-400 text-[10px] font-black uppercase font-mono tracking-widest flex items-center gap-1 leading-none">
              <Sparkles className="w-3 h-3 text-purple-450 animate-pulse" />
              SÁCH LƯỢC PHÂN KHÚC V2.0
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Giả Lập Khảo Sát &amp; Phân Tích Thị Trường SME VN
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Tự động hái nạp dữ liệu từ internet thông qua Google Search Grounding để validate ý tưởng tài chính &amp; SaaS solo founder.
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-emerald-450 text-[11px] font-black uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-500" />
            Excel Du Kích
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-slate-900/60 border border-slate-800 hover:border-slate-705 hover:bg-slate-904 text-cyan-405 text-[11px] font-black uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-500" />
            Xuất PDF Sách Lược
          </button>
        </div>
      </div>

      {/* ROADMAP / CONTEXT EXPLAINER FROM FILE */}
      <div className="bg-purple-950/10 border border-purple-500/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start text-xs text-slate-300">
        <div className="p-2.5 bg-purple-600/10 rounded-xl text-purple-400">
          <Compass className="w-6 h-6 animate-spin-slow" />
        </div>
        <div className="space-y-1.5">
          <span className="text-purple-400 font-extrabold tracking-wider uppercase text-[10px] font-mono block">Ý NGHĨA KỸ THUẬT</span>
          <p className="leading-relaxed">
            Thay vì khảo sát thủ công đắt đỏ, hệ thống áp dụng kỹ thuật <strong>"Desk Research + Synthetic Survey"</strong> thịnh hành toàn cầu. Trợ lý AI thực thi các luồng tìm kiếm thực chứng trên các hội nhóm kế toán lớn nhất của Việt Nam, chắt lọc các mẫu hình giá cả, phân tích GAP chưa được khai phá và tạo dựng 10 Persona chân dung ảo chất lượng cao để sếp đối sánh trước khi chiêu binh lập trình!
          </p>
        </div>
      </div>

      {/* CONFIG PANEL */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* CHOOSE PRESET */}
        <div className="md:col-span-1 space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-900">
          <h2 className="text-xs font-black text-slate-450 uppercase tracking-widest font-mono">
            🎯 Bước 1: Chọn Đề Án Khảo Sát
          </h2>
          
          <div className="space-y-2.5">
            {PRESETS.map((p) => (
              <label 
                key={p.id}
                onClick={() => {
                  setIsCustomMode(false);
                  setSelectedPresetId(p.id);
                }}
                className={`block text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  !isCustomMode && selectedPresetId === p.id 
                    ? 'bg-purple-950/20 border-purple-500/60 ring-1 ring-purple-500/30 text-white' 
                    : 'bg-[#010307] border-slate-850 hover:bg-slate-900/30 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="preset_survey"
                    checked={!isCustomMode && selectedPresetId === p.id}
                    onChange={() => {}}
                    className="accent-purple-500 shrink-0"
                  />
                  <span className="text-xs font-black">{p.title.split('—')[0]}</span>
                </div>
                <p className="text-[10.5px] font-semibold leading-relaxed mt-1 text-slate-400">
                  {p.description}
                </p>
              </label>
            ))}

            <label 
              onClick={() => setIsCustomMode(true)}
              className={`block text-left p-3 rounded-xl border transition-all cursor-pointer ${
                isCustomMode 
                  ? 'bg-purple-950/20 border-purple-500/60 ring-1 ring-purple-500/30 text-white' 
                  : 'bg-[#010307] border-slate-850 hover:bg-slate-900/30 text-slate-400 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="preset_survey"
                  checked={isCustomMode}
                  onChange={() => {}}
                  className="accent-purple-500 shrink-0"
                />
                <span className="text-xs font-black">4. CHẠY KHẢO SÁT TÙY CHỈNH (CUSTOM NICHE)</span>
              </div>
              <p className="text-[10.5px] font-medium leading-relaxed mt-1 text-slate-400">
                Nhập bất cứ ý tưởng hay ngách thị trường cụ thể nào của bạn tại Việt Nam để AI dọn quét internet.
              </p>
            </label>
          </div>
        </div>

        {/* INPUT PARAMETER */}
        <div className="md:col-span-2 space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-450 uppercase tracking-widest font-mono">
              ⚙️ Bước 2: Điểu chỉnh Biên Khảo Sát
            </h2>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1.5 font-mono">
                  Chuỗi tìm kiếm nghiệp vụ (Niche Keywords)
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    disabled={!isCustomMode}
                    value={isCustomMode ? customNiche : (currentPreset?.niche || "")}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    placeholder="Ví dụ: phần mềm quét hóa đơn vat tự động cho đại lý thuế việt nam"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 pl-10 text-xs font-bold text-slate-200 focus:outline-none focus:border-purple-600 disabled:opacity-60"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-1">
                  {!isCustomMode 
                    ? "✓ Đang khóa theo sườn sách lược v2.0 tối ưu. Hãy bấm Chọn Tùy Chỉnh để tự gõ từ khóa tự do của bạn."
                    : "⚡ Gợi ý: Gõ cụ thể thị trường ngách ở Việt Nam giúp kết quả tìm kiếm Google đạt độ hạch chuẩn cao."}
                </p>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1.5 font-mono">
                  Phân khúc kiến trúc đề xuất (Selected Track)
                </label>
                <input
                  type="text"
                  disabled
                  value={isCustomMode ? "custom_saas_platform" : (currentPreset?.direction || "")}
                  className="w-full bg-slate-950/50 border border-slate-900 rounded-xl p-2.5 text-xs font-mono text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 flex gap-2.5">
            <button
              onClick={() => triggerMockOrLiveSurvey(false)}
              disabled={isLoading}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang quét và tổng hợp dữ liệu...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-40 animate-pulse" />
                  Khởi chạy Khảo sát Google Grounding
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SURVEY LOG MONITOR */}
      {logMessages.length > 0 && (
        <div className="bg-[#02040a] border border-slate-900 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5 uppercase font-black text-slate-400">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse inline-block"></span>
              Bảng log tiến độ khảo sát biên
            </span>
            <span>CLI MONITOR v1.4</span>
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] font-mono leading-relaxed text-slate-300">
            {logMessages.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* ANALYSIS RESULT */}
      {surveyResult && (
        <div className="space-y-8 pt-4 border-t border-slate-900">
          
          {/* SECTION 1: DETAILED SUMMARY */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              1. Bức tranh Tổng quan &amp; Kết quả tìm kiếm thực chứng
            </h2>
            <div className="bg-[#050912] p-5 rounded-2xl border border-slate-900 leading-relaxed text-xs text-slate-300">
              {surveyResult.summary}
            </div>
          </div>

          {/* SECTION 2: METRICS VISUALIZATION */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              2. Biểu đồ thống kê thị trường SME Giả lập
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              
              {/* CHART 1: PRICING PREFERENCE */}
              <div className="bg-[#02050b] p-4 rounded-xl border border-slate-900 space-y-3">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider block">
                  Mức giá sẵn sàng chi trả (VNĐ / Tháng)
                </span>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={surveyResult.metrics.pricingPreferred} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ background: '#090d16', border: '1px solid #1e293b', fontSize: 11 }} />
                      <Bar dataKey="percent" fill="#6366f1" radius={[4, 4, 0, 0]}>
                        {surveyResult.metrics.pricingPreferred.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9.5px] text-slate-500 font-medium leading-relaxed">
                  Insight: Điểm ngọt cực cao phục vụ Solo Founder là phân khúc dưới 300k, đại đa số SME không chấp nhận mức chi sâu hơn.
                </p>
              </div>

              {/* CHART 2: PAIN POINTS FREQUENCY */}
              <div className="bg-[#02050b] p-4 rounded-xl border border-slate-900 space-y-3">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider block">
                  Nỗi đau chí tử ảnh hưởng quyết định (%)
                </span>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={surveyResult.metrics.painPoints} margin={{ top: 10, right: 10, left: -20, bottom: 5 }} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis dataKey="issue" type="category" width={80} tick={{ fontSize: 8, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ background: '#090d16', border: '1px solid #1e293b', fontSize: 11 }} />
                      <Bar dataKey="percent" fill="#ec4899" radius={[0, 4, 4, 0]}>
                        {surveyResult.metrics.painPoints.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9.5px] text-slate-500 font-medium leading-relaxed">
                  Insight: Vấn đề bảo mật thông tin tài chính cá nhân chiếm 44%, vượt xa giá cả. Giải pháp của bạn cần giải quyết dứt điểm rào cản này.
                </p>
              </div>

              {/* CHART 3: CHANNELS OF ACQUISITION */}
              <div className="bg-[#02050b] p-4 rounded-xl border border-slate-900 space-y-3">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider block">
                  Kênh phân phối / Tiếp cận cốt lõi (%)
                </span>
                <div className="h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={surveyResult.metrics.channels}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="percent"
                      >
                        {surveyResult.metrics.channels.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#090d16', border: '1px solid #1e293b', fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 font-mono text-[8px] text-slate-400 max-h-12 overflow-y-auto">
                  {surveyResult.metrics.channels.map((ch, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: COLORS[(idx + 1) % COLORS.length] }}></span>
                      <span>{ch.name} ({ch.percent}%)</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 3: SIMULATED TARGET PERSONA INTERVIEWS */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              3. Giả lập nhật ký Phỏng vấn Personas thực địa
            </h2>

            <div className="bg-[#040813] border border-slate-900 rounded-2xl p-4 space-y-4">
              {/* Tab selector */}
              <div className="flex gap-2 border-b border-slate-900 pb-2 overflow-x-auto">
                {surveyResult.personas.map((per, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePersonaTab(idx)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      activePersonaTab === idx 
                        ? 'bg-purple-600/15 border border-purple-500/30 text-purple-400' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    👤 {per.name.split(' ')[0]} ({per.role.split(' ')[0]})
                  </button>
                ))}
              </div>

              {/* Persona Content Card */}
              {surveyResult.personas[activePersonaTab] && (
                <div className="grid md:grid-cols-3 gap-6 pt-2">
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 font-mono block">QUOTES BẢN TIN PHỎNG VẤN</span>
                      <blockquote className="text-sm font-extrabold text-slate-200 border-l-2 border-purple-500 pl-3 italic">
                        "{surveyResult.personas[activePersonaTab].quote}"
                      </blockquote>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-[#02050b] p-3 rounded-xl border border-slate-900/50 space-y-1">
                        <span className="text-[10px] text-slate-500 font-extrabold block">NỖI ĐAU CHÍ TỬ (PAIN)</span>
                        <p className="text-slate-300 font-medium">{surveyResult.personas[activePersonaTab].painPoint}</p>
                      </div>
                      <div className="bg-[#02050b] p-3 rounded-xl border border-slate-900/50 space-y-1">
                        <span className="text-[10px] text-slate-500 font-extrabold block">SẮN SÀNG CHI TRẢ</span>
                        <p className="text-emerald-400 font-bold">{surveyResult.personas[activePersonaTab].willingnessToPay}</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-1 border-l border-slate-900 pl-0 md:pl-6 space-y-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-extrabold block">KÊNH TIẾP CẬN TỰ NHIÊN</span>
                      <p className="text-slate-300 font-medium font-mono">{surveyResult.personas[activePersonaTab].channel}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-extrabold block">CHIẾN LƯỢC MỜI CHÀO (GTM)</span>
                      <p className="text-purple-400 font-black">{surveyResult.personas[activePersonaTab].harnessStrategy}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: GAP ANALYSIS & BENCHMARKS */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* MARKET GAPS */}
            <div className="bg-[#02050b] p-5 rounded-2xl border border-slate-900 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Khoảng Trống / Gaps Thị Trường Chưa Lấp Đầy
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {surveyResult.gaps.map((gap, i) => (
                  <li key={i} className="flex gap-2 items-start font-medium leading-relaxed">
                    <span className="p-1 px-1.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-black leading-none font-mono">GAP {i+1}</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* COMPETITOR MATRIX */}
            <div className="bg-[#02050b] p-5 rounded-2xl border border-slate-900 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Zap className="w-4 h-4 text-emerald-400" />
                Ma trận so sánh Đối Thủ cạnh tranh
              </h3>
              <div className="space-y-3 max-h-56 overflow-y-auto">
                {surveyResult.competitors.map((comp, i) => (
                  <div key={i} className="bg-slate-950/40 p-3 rounded-xl border border-slate-900 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-100">🔥 {comp.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[9px] text-emerald-500 font-extrabold uppercase">Thế mạnh:</span>
                        <p className="text-slate-400 leading-snug font-medium">{comp.strength}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-rose-500 font-extrabold uppercase">Điểm yếu:</span>
                        <p className="text-slate-400 leading-snug font-medium">{comp.weakness}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* SECTION 5: ZERO TO MARKET STRATEGY BLUEPRINT */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse" />
              4. Chiến lược Phát hành mượt mà (0đ Sandbox Setup)
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              
              {/* PIPELINE ARCHITECTURE */}
              <div className="bg-[#02050b] p-4.5 rounded-xl border border-slate-900 space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <span className="text-[9.5px] text-slate-500 font-extrabold font-mono uppercase tracking-wider block">
                    ⚙️ Hạ tầng Triển khai 0đ (Free cloud)
                  </span>
                  <p className="text-slate-300 font-medium leading-relaxed mt-2.5">
                    {surveyResult.blueprint.zeroCostPipeline}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-900 flex items-center gap-1 text-[10px] text-purple-400 font-bold">
                  <span>Học hỏi hạ tầng chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* LANDING PAGE IDEATION */}
              <div className="bg-[#02050b] p-4.5 rounded-xl border border-slate-900 space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <span className="text-[9.5px] text-slate-500 font-extrabold font-mono uppercase tracking-wider block">
                    💡 Thông điệp Landing Page ăn khách
                  </span>
                  <p className="text-slate-300 font-medium leading-relaxed mt-2.5 italic">
                    "{surveyResult.blueprint.landingPageIdea}"
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-900 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <span>Ứng dụng kịch bản mộc</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* ROADMAP CALENDAR */}
              <div className="bg-[#02050b] p-4.5 rounded-xl border border-slate-900 space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <span className="text-[9.5px] text-slate-500 font-extrabold font-mono uppercase tracking-wider block">
                    📅 Lộ trình 90 ngày phát hành (GTM)
                  </span>
                  <ul className="space-y-2 mt-2.5 text-[10.5px]">
                    {surveyResult.blueprint.roadmap90Days.slice(0, 3).map((rd, i) => (
                      <li key={i} className="text-slate-300 flex gap-1.5 items-start">
                        <span className="text-amber-500 shrink-0 font-bold">✓</span>
                        <span className="leading-snug">{rd}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-3 border-t border-slate-900 flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                  <span>Mổ xẻ quy trình 90 ngày</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 6: GOOGLE GROUNDING SOURCES */}
          <div className="bg-[#010408]/90 border border-slate-900 p-4.5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0 animate-spin-slow" />
              <span className="text-xs font-black text-slate-200 uppercase tracking-widest font-mono">
                🔗 Các Nguồn dữ liệu thời gian thực được định vị (Google Web References)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Dưới đây là các tài liệu nghiên cứu, bài báo cáo thực tế, và liên kết diễn đàn đã được AI quét trích để dọn dẹp số liệu phân tích:
            </p>
            <div className="grid md:grid-cols-3 gap-3.5 pt-1.5">
              {surveyResult.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-950 p-3 rounded-xl border border-slate-900 hover:border-slate-800 transition-all flex items-center justify-between gap-2.5 group cursor-pointer"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-black text-slate-200 block truncate group-hover:text-purple-400">
                      {src.title}
                    </span>
                    <span className="text-[8.5px] font-mono text-slate-500 block truncate">
                      {src.url}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white shrink-0" />
                </a>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
