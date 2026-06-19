import React, { useState, useMemo } from "react";
import { 
  Video, 
  Youtube, 
  Sparkles, 
  DollarSign, 
  Layers, 
  Plus, 
  Tv, 
  TrendingUp, 
  Eye, 
  Loader2, 
  Play, 
  Heart, 
  Flame, 
  Share2, 
  Bookmark 
} from "lucide-react";

type PlatformType = "TikTok" | "YouTube" | "Reels";
type VideoStatus = "Ý tưởng" | "Đang quay" | "Đang dựng" | "Đã đăng";
type VideoGoal = "Kiếm tiền Ads" | "Bán Phần mềm/Game" | "Tiếp thị Affiliate" | "Tài trợ Brand";

interface VideoItem {
  id: string;
  title: string;
  platform: PlatformType;
  status: VideoStatus;
  goal: VideoGoal;
  views: number;
  revenue: number;
  cta: string;
}

const initialVideos: VideoItem[] = [
  {
    id: "v-1",
    title: "Cách tôi code Game 2D trong 24h và kiếm 500$ đầu tiên",
    platform: "YouTube",
    status: "Đã đăng",
    goal: "Bán Phần mềm/Game",
    views: 45000,
    revenue: 350,
    cta: "Link tải game ở mô tả"
  },
  {
    id: "v-2",
    title: "Chủ doanh nghiệp mất tiền tỷ vì lỗi thuế ngớ ngẩn này",
    platform: "TikTok",
    status: "Đã đăng",
    goal: "Bán Phần mềm/Game",
    views: 120000,
    revenue: 480,
    cta: "Dùng thử LedgerFlow miễn phí"
  },
  {
    id: "v-3",
    title: "3 công cụ AI giúp làm video không cần lộ mặt cực nhanh",
    platform: "TikTok",
    status: "Đang dựng",
    goal: "Tiếp thị Affiliate",
    views: 0,
    revenue: 0,
    cta: "Link công cụ ở bio"
  },
  {
    id: "v-4",
    title: "Review chi tiết LedgerFlow: Quản lý công ty solo-founder 0đ",
    platform: "Reels",
    status: "Ý tưởng",
    goal: "Bán Phần mềm/Game",
    views: 0,
    revenue: 0,
    cta: "Link LedgerFlow"
  }
];

export default function AIContentVideoLab() {
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [busy, setBusy] = useState(false);
  
  // AI Script Generator State
  const [topic, setTopic] = useState("Lập trình ứng dụng học kế toán bằng Phaser.js trong 1 ngày");
  const [platform, setPlatform] = useState<PlatformType>("TikTok");
  const [tone, setTone] = useState("Chuyên gia");
  const [goal, setGoal] = useState<VideoGoal>("Bán Phần mềm/Game");
  const [scriptOutput, setScriptOutput] = useState<{
    hook: string;
    outline: string[];
    cta: string;
    description: string;
  } | null>(null);

  // Planner Form State
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState<PlatformType>("TikTok");
  const [newGoal, setNewGoal] = useState<VideoGoal>("Bán Phần mềm/Game");
  const [newStatus, setNewStatus] = useState<VideoStatus>("Ý tưởng");
  const [newCta, setNewCta] = useState("");

  // Simulator State
  const [simViews, setSimViews] = useState(50000);
  const [simRpm, setSimRpm] = useState(1.5); // USD per 1000 views
  const [conversionRate, setConversionRate] = useState(0.5); // %
  const [productPrice, setProductPrice] = useState(299); // K VND
  const [commissionRate, setCommissionRate] = useState(15); // % (Affiliate)

  // Simulation Calculations
  const simResults = useMemo(() => {
    const adSenseRev = (simViews / 1000) * simRpm * 25000; // in VND
    const buyers = Math.round(simViews * (conversionRate / 100));
    
    let productRev = 0;
    let affiliateRev = 0;

    if (goal === "Bán Phần mềm/Game") {
      productRev = buyers * productPrice * 1000;
    } else if (goal === "Tiếp thị Affiliate") {
      affiliateRev = buyers * (productPrice * 1000) * (commissionRate / 100);
    } else if (goal === "Tài trợ Brand") {
      productRev = 5000000; // Fixed sponsor estimation
    }

    const totalVND = adSenseRev + productRev + affiliateRev;
    
    return {
      adSense: adSenseRev,
      conversions: buyers,
      product: productRev,
      affiliate: affiliateRev,
      total: totalVND
    };
  }, [simViews, simRpm, conversionRate, productPrice, commissionRate, goal]);

  // Handle AI Script Generation
  async function handleGenerateScript() {
    setBusy(true);
    try {
      const prompt = `Viết một kịch bản video ngắn tối ưu hóa thuật toán dạng ${platform}.
Chủ đề: "${topic}"
Giọng điệu: ${tone}
Mục tiêu video: ${goal}

Yêu cầu output trả về dưới dạng JSON thô (không có markdown code block \`\`\`json) với cấu trúc sau:
{
  "hook": "Câu tiêu đề giật tít 3 giây đầu tiên cực cuốn hút",
  "outline": [
    "Bước 1: visual mô tả cảnh, nội dung nói ngắn gọn",
    "Bước 2: visual mô tả cảnh, nội dung nói ngắn gọn",
    "Bước 3: visual mô tả cảnh, nội dung nói ngắn gọn"
  ],
  "cta": "Câu kêu gọi hành động (CTA) tương ứng với mục tiêu",
  "description": "Nội dung mô tả ngắn kèm hashtag phù hợp"
}`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      
      if (data.success && data.content) {
        // Safe JSON Parse
        let cleanText = data.content.trim();
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.substring(7);
        }
        if (cleanText.endsWith("```")) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        const json = JSON.parse(cleanText.trim());
        setScriptOutput(json);
      } else {
        throw new Error(data.error || "Không thể sinh kịch bản.");
      }
    } catch (err: any) {
      alert(`Lỗi sinh kịch bản AI: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  // Handle Adding New Video
  function handleAddVideo() {
    if (!newTitle.trim()) return;
    const next: VideoItem = {
      id: `v-${Date.now()}`,
      title: newTitle.trim(),
      platform: newPlatform,
      status: newStatus,
      goal: newGoal,
      views: 0,
      revenue: 0,
      cta: newCta.trim() || "Chưa thiết lập CTA"
    };
    setVideos((prev) => [next, ...prev]);
    setNewTitle("");
    setNewCta("");
  }

  // Handle Deleting Video
  function handleDeleteVideo(id: string) {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }

  return (
    <div className="space-y-6 select-text">
      {/* HEADER HERO */}
      <div className="rounded-3xl border border-pink-500/25 bg-gradient-to-br from-pink-950/20 via-slate-950 to-slate-950 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-pink-500/5 blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-2 text-pink-400 text-xs font-black uppercase tracking-widest">
          <Tv className="w-4 h-4 animate-pulse" /> AI Content &amp; Media Studio
        </div>
        <h2 className="text-2xl font-black text-white mt-2">Phòng Nội Dung &amp; Truyền Thông</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Kênh Marketing &amp; Doanh thu thụ động của Studio sản phẩm. Lập kế hoạch sản xuất các video ngắn TikTok, YouTube và Reels để thu hút traffic tải game, mua phần mềm, kiếm tiền AdSense và tiếp thị liên kết.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: SCRIPT GENERATOR (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-black text-white">
              <Sparkles className="w-4 h-4 text-pink-400" /> Trình viết kịch bản video AI
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Chủ đề video</label>
                <input 
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none focus:border-pink-500" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Cách kiếm 10M từ game 2D cơ bản..."
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Nền tảng</label>
                  <select 
                    value={platform} 
                    onChange={(e) => setPlatform(e.target.value as PlatformType)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-bold text-slate-100 outline-none"
                  >
                    <option value="TikTok">TikTok (Shorts)</option>
                    <option value="YouTube">YouTube (Long)</option>
                    <option value="Reels">FB Reels</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Giọng điệu</label>
                  <select 
                    value={tone} 
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-bold text-slate-100 outline-none"
                  >
                    <option value="Chuyên gia">Chuyên gia</option>
                    <option value="Hài hước">Hài hước</option>
                    <option value="Năng động">Năng động</option>
                    <option value="Kịch tính">Kịch tính</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Mục tiêu chính</label>
                  <select 
                    value={goal} 
                    onChange={(e) => setGoal(e.target.value as VideoGoal)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-bold text-slate-100 outline-none"
                  >
                    <option value="Bán Phần mềm/Game">Bán Game/App</option>
                    <option value="Tiếp thị Affiliate">Tiếp thị Affiliate</option>
                    <option value="Kiếm tiền Ads">Kiếm Adsense</option>
                    <option value="Tài trợ Brand">Sponsor/Brand</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateScript}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs uppercase tracking-wider py-2.5 transition disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Viết kịch bản tự động bằng AI
              </button>
            </div>

            {scriptOutput && (
              <div className="rounded-xl border border-pink-500/20 bg-pink-950/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-pink-300 font-extrabold text-xs">
                  <Play className="w-4 h-4 fill-pink-300" /> BẢN NHÁP KỊCH BẢN AI
                </div>
                
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-900">
                  <div className="text-[10px] text-pink-400 font-black uppercase mb-1">Hook (3 giây đầu)</div>
                  <div className="text-xs text-white font-bold leading-relaxed">🗣️ &quot;{scriptOutput.hook}&quot;</div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-900 space-y-2">
                  <div className="text-[10px] text-cyan-400 font-black uppercase mb-1">Cấu trúc phân cảnh (Outline)</div>
                  {scriptOutput.outline.map((step, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                      <span className="text-cyan-400 font-black shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-900">
                    <div className="text-[10px] text-emerald-450 font-black uppercase mb-0.5">Call to Action (CTA)</div>
                    <div className="text-xs text-slate-300 font-bold">🎯 {scriptOutput.cta}</div>
                  </div>
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-900">
                    <div className="text-[10px] text-amber-450 font-black uppercase mb-0.5">Mô tả &amp; Tag</div>
                    <div className="text-[11px] text-slate-400 truncate" title={scriptOutput.description}>{scriptOutput.description}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CREATOR SIMULATOR CARD */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-black text-white">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Trình giả lập doanh thu Video (Creator ROI)
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Mô phỏng doanh số tích hợp: Doanh thu = Tiền quảng cáo lượt xem (AdSense/CPM) + Tiền bán Game/App chuyển đổi trực tiếp từ link video.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                  <span>Lượt xem ước lượng (Views)</span>
                  <span className="text-white font-black">{simViews.toLocaleString()} views</span>
                </div>
                <input 
                  type="range" 
                  min={1000} 
                  max={500000} 
                  step={5000}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                  value={simViews}
                  onChange={(e) => setSimViews(Number(e.target.value))}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>RPM ước lượng (USD/1000 views)</span>
                    <span className="text-white font-black">{simRpm}$</span>
                  </div>
                  <input 
                    type="range" 
                    min={0.1} 
                    max={5.0} 
                    step={0.1}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                    value={simRpm}
                    onChange={(e) => setSimRpm(Number(e.target.value))}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                    <span>Tỷ lệ mua hàng/tải App (Conversion)</span>
                    <span className="text-white font-black">{conversionRate}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={0.05} 
                    max={2.0} 
                    step={0.05}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Đơn giá phần mềm (K VND)</label>
                  <input 
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-1">Hoa hồng Affiliate (%) nếu làm tiếp thị</label>
                  <input 
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-900 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl">
                  <div className="text-[9px] font-black uppercase text-slate-500">Tiền quảng cáo Ads</div>
                  <div className="text-sm font-black text-white mt-1">{simResults.adSense.toLocaleString("vi-VN")} ₫</div>
                </div>
                <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl">
                  <div className="text-[9px] font-black uppercase text-slate-500">Lượt chuyển đổi</div>
                  <div className="text-sm font-black text-white mt-1">{simResults.conversions} khách</div>
                </div>
                <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl">
                  <div className="text-[9px] font-black uppercase text-slate-500">Doanh số tự bán</div>
                  <div className="text-sm font-black text-emerald-400 mt-1">
                    {goal === "Bán Phần mềm/Game" ? `${simResults.product.toLocaleString("vi-VN")} ₫` : "0 ₫"}
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl">
                  <div className="text-[9px] font-black uppercase text-slate-500">Doanh số Affiliate</div>
                  <div className="text-sm font-black text-pink-400 mt-1">
                    {goal === "Tiếp thị Affiliate" ? `${simResults.affiliate.toLocaleString("vi-VN")} ₫` : "0 ₫"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-300 uppercase tracking-wider">Tổng doanh thu dự kiến (VND)</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Đã bao gồm tỷ giá AdSense cập nhật</p>
                </div>
                <div className="text-2xl font-black text-emerald-300 font-mono">
                  {simResults.total.toLocaleString("vi-VN")} ₫
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PLANNER & CALENDAR (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-black text-white font-mono">
              <Layers className="w-4 h-4 text-cyan-400" /> Lịch sản xuất video
            </h3>

            {/* MANUALLY ADD VIDEO */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-900 space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-500">Thêm video mới</p>
              <input 
                className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3 py-1.5 text-xs text-white" 
                placeholder="Tiêu đề video sắp làm..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={newPlatform} 
                  onChange={(e) => setNewPlatform(e.target.value as PlatformType)}
                  className="rounded-xl border border-slate-850 bg-slate-950 p-1.5 text-xs text-slate-100"
                >
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Reels">FB Reels</option>
                </select>
                <select 
                  value={newGoal} 
                  onChange={(e) => setNewGoal(e.target.value as VideoGoal)}
                  className="rounded-xl border border-slate-850 bg-slate-950 p-1.5 text-xs text-slate-100"
                >
                  <option value="Bán Phần mềm/Game">Bán Game/App</option>
                  <option value="Tiếp thị Affiliate">Affiliate</option>
                  <option value="Kiếm tiền Ads">Kiếm Ads</option>
                  <option value="Tài trợ Brand">Tài trợ</option>
                </select>
              </div>
              <input 
                className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3 py-1.5 text-xs text-white" 
                placeholder="Kêu gọi hành động (ví dụ: Link ở bio)"
                value={newCta}
                onChange={(e) => setNewCta(e.target.value)}
              />
              <button 
                onClick={handleAddVideo}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs uppercase py-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Lên lịch video
              </button>
            </div>

            {/* VIDEO LIST */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {videos.map((vid) => (
                <div key={vid.id} className="rounded-xl border border-slate-900 bg-slate-950/80 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {vid.platform === "YouTube" ? (
                          <Youtube className="w-4 h-4 text-red-500" />
                        ) : (
                          <Video className="w-4 h-4 text-pink-500" />
                        )}
                        <span className="text-xs font-black text-white leading-tight">{vid.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Mục tiêu: <strong className="text-slate-350">{vid.goal}</strong> · Trạng thái: <strong className="text-cyan-400">{vid.status}</strong>
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteVideo(vid.id)} 
                      className="text-[10px] font-bold text-slate-600 hover:text-rose-400"
                    >
                      Xóa
                    </button>
                  </div>
                  {vid.status === "Đã đăng" && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-900/60 pt-2 text-slate-400 font-mono">
                      <div>👁️ {vid.views.toLocaleString()} views</div>
                      <div className="text-right text-emerald-450 font-bold">💰 +{vid.revenue}$</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* HIGH-CONVERTING HOOK LIBRARY */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-black text-white">
              <Flame className="w-4 h-4 text-amber-500" /> Thư viện công thức Hook 3 giây
            </h3>
            
            <div className="space-y-2.5">
              {[
                {
                  name: "Khơi gợi bí mật / Đố kỵ",
                  desc: "Chỉ người thành công mới biết điều này.",
                  template: "Bí mật code game 2D kiếm 500$/tháng mà không giảng viên nào chỉ bạn..."
                },
                {
                  name: "Cảnh báo rủi ro / Sợ hãi",
                  desc: "Tập trung vào nỗi sợ mất mát lớn.",
                  template: "Ngưng dùng excel làm kế toán nếu không muốn mất tiền tỷ vì lỗi này..."
                },
                {
                  name: "Tự động hóa / Lười biếng",
                  desc: "Giải pháp nhanh gọn, tốn ít công sức.",
                  template: "Cách tôi tự động hóa 80% công việc văn phòng nhờ AI LedgerFlow..."
                }
              ].map((hook, i) => (
                <div key={i} className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-500">{hook.name}</span>
                    <span className="text-[8px] text-slate-550 font-bold">{hook.desc}</span>
                  </div>
                  <p className="text-xs text-slate-350 italic font-semibold leading-relaxed">&quot;{hook.template}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
