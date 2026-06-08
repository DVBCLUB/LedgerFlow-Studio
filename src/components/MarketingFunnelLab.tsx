import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Eye, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Target, 
  Coins, 
  Shuffle, 
  FileSpreadsheet, 
  Megaphone, 
  ArrowRight, 
  Tv 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart as RechartsLineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface FunnelStage {
  id: string;
  name: string;
  visitors: number;
  converted: number;
  label: 'TOFU' | 'MOFU' | 'BOFU' | 'RETENTION';
  color: string;
  dropOffReason: string;
}

interface CTAVariant {
  id: string;
  headline: string;
  ctaText: string;
  urgencyScore: number;   // 1-10
  clarityScore: number;   // 1-10
  estimatedCTR: number;   // %
}

interface MicroEvent {
  id: string;
  name: string;
  trigger: string;
  weight: number;       // điểm tích luỹ
  count: number;
  lastFired: string;
}

const HOOK_LIBRARY = [
  "Bạn đang mất bao nhiêu tiền vì không theo dõi dòng tiền?",
  "Kế toán không cần bằng đại học — chỉ cần công cụ đúng",
  "SME Việt tiết kiệm 3 triệu/tháng tiền kế toán với LedgerFlow",
  "Quyết toán thuế sai → phạt 20% — bạn đã kiểm tra chưa?",
  "Từ Excel rối rắm → báo cáo tài chính chuyên nghiệp trong 5 phút",
  "Solo founder không cần CFO — cần phần mềm thay CFO",
  "Tháng đầu miễn phí — không cần thẻ tín dụng",
  "800+ SME Việt đang dùng LedgerFlow mỗi ngày",
];

export default function MarketingFunnelLab() {
  const [activeSubTab, setActiveSubTab] = useState<'funnel_builder' | 'cac_ltv' | 'cta_tester' | 'micro_events'>('funnel_builder');

  // --- TAB 1: FUNNEL STATE ---
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([
    { id: 'f1', name: 'SEO & Quảng cáo (Mục tiêu tiếp cận)', visitors: 10000, converted: 2800, label: 'TOFU', color: '#8b5cf6', dropOffReason: 'Quảng cáo sai đối tượng hoặc trang đích tải chậm' },
    { id: 'f2', name: 'Khách xem Trang Đăng ký (Landing Page)', visitors: 2800, converted: 840, label: 'MOFU', color: '#6366f1', dropOffReason: 'Form đăng ký quá dài hoặc thiếu bảng chứng thực' },
    { id: 'f3', name: 'Tiếp cận Trang Giá & Premium', visitors: 840, converted: 420, label: 'BOFU', color: '#f59e0b', dropOffReason: 'Giá quá cao hoặc không hỗ trợ thanh toán nội địa' },
    { id: 'f4', name: 'Kích hoạt Dùng thử (Retention)', visitors: 420, converted: 126, label: 'RETENTION', color: '#10b981', dropOffReason: 'Thiếu onboarding tự động dẫn dắt người dùng mới' }
  ]);

  const [newStageName, setNewStageName] = useState('');
  const [newStageVisitors, setNewStageVisitors] = useState<number>(1000);
  const [newStageConverted, setNewStageConverted] = useState<number>(200);
  const [newStageLabel, setNewStageLabel] = useState<'TOFU' | 'MOFU' | 'BOFU' | 'RETENTION'>('MOFU');
  const [newStageReason, setNewStageReason] = useState('');
  const [showAddStage, setShowAddStage] = useState(false);

  // --- TAB 2: CAC/LTV STATE ---
  const [marketingCost, setMarketingCost] = useState<number>(30); // triệu VNĐ
  const [newAcquisitions, setNewAcquisitions] = useState<number>(120); // khách mới
  const [avgMRR, setAvgMRR] = useState<number>(1.2); // triệu VNĐ / khách
  const [churnRate, setChurnRate] = useState<number>(4.5); // % tháng

  // --- TAB 3: CTA TESTER STATE ---
  const [ctaVariants, setCtaVariants] = useState<CTAVariant[]>([
    { id: 'cta1', headline: 'Phần mềm Kế toán tinh gọn dành riêng cho Solo Founder', ctaText: 'Kích hoạt dùng thử 15 ngày miễn phí', urgencyScore: 6, clarityScore: 9, estimatedCTR: 4.8 },
    { id: 'cta2', headline: 'Bỏ qua Excel rối rắm, dọn dẹp số sách Thuế chỉ trong 5 phút!', ctaText: 'Nhận bản dùng thử không cần thẻ tín dụng', urgencyScore: 9, clarityScore: 7, estimatedCTR: 6.2 },
    { id: 'cta3', headline: 'Hệ thống hạch toán SME chuyên sâu phù hợp tuyệt đối luật Việt Nam', ctaText: 'Xem demo và tải miễn phí 10 bộ hạch toán', urgencyScore: 5, clarityScore: 8, estimatedCTR: 3.5 }
  ]);
  const [newCtaHeadline, setNewCtaHeadline] = useState('');
  const [newCtaText, setNewCtaText] = useState('');

  // --- TAB 4: MICRO EVENTS STATE ---
  const [microEvents, setMicroEvents] = useState<MicroEvent[]>([
    { id: 'e1', name: 'Xem bảng giá chi tiết', trigger: 'Scroll > 50% trang pricing', weight: 15, count: 420, lastFired: '2026-06-08 10:15:32' },
    { id: 'e2', name: 'Nhấp mở tài liệu hạch toán mẫu', trigger: 'Click button [Download template]', weight: 10, count: 720, lastFired: '2026-06-08 11:02:11' },
    { id: 'e3', name: 'Click hỗ trợ trực tuyến Zalo', trigger: 'Click floating widget Zalo Chat', weight: 25, count: 185, lastFired: '2026-06-08 09:44:03' },
    { id: 'e4', name: 'Nhập thông tin doanh thu', trigger: 'Input field trong tax calculator', weight: 20, count: 530, lastFired: '2026-06-08 10:55:18' }
  ]);
  const [newEventName, setNewEventName] = useState('');
  const [newEventTrigger, setNewEventTrigger] = useState('');
  const [newEventWeight, setNewEventWeight] = useState<number>(10);
  const [showAddEvent, setShowAddEvent] = useState(false);

  // --- CALCULATED VALUES & DATA TRANSFORMATIONS ---
  // Funnel calculations
  const calculateFunnelGraphData = () => {
    return funnelStages.map((stage) => {
      const conversionRate = stage.visitors > 0 ? ((stage.converted / stage.visitors) * 100).toFixed(1) : '0';
      const dropOffRate = (100 - parseFloat(conversionRate)).toFixed(1);
      return {
        name: stage.name,
        'Lượt truy cập': stage.visitors,
        'Lượt chuyển đổi': stage.converted,
        'Tỷ lệ chuyển đổi %': parseFloat(conversionRate),
        'Tỷ lệ rời bỏ %': parseFloat(dropOffRate)
      };
    });
  };

  // Overall Conversion rate (first stage visitors vs last stage converted)
  const firstStageVisitors = funnelStages[0]?.visitors || 1;
  const lastStageConverted = funnelStages[funnelStages.length - 1]?.converted || 0;
  const overallConversionRate = ((lastStageConverted / firstStageVisitors) * 100).toFixed(2);

  const handleCreateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    const colors = {
      TOFU: '#8b5cf6',
      MOFU: '#6366f1',
      BOFU: '#f59e0b',
      RETENTION: '#10b981'
    };

    const newStage: FunnelStage = {
      id: 'f_' + Date.now(),
      name: newStageName,
      visitors: newStageVisitors,
      converted: newStageConverted,
      label: newStageLabel,
      color: colors[newStageLabel],
      dropOffReason: newStageReason || 'Lý do chưa xác định hoặc trải nghiệm trang chưa tốt'
    };

    setFunnelStages([...funnelStages, newStage]);
    setNewStageName('');
    setNewStageReason('');
    setShowAddStage(false);
  };

  const deleteStage = (id: string) => {
    setFunnelStages(funnelStages.filter(s => s.id !== id));
  };

  // CAC & LTV Math
  const cac = newAcquisitions > 0 ? marketingCost / newAcquisitions : 0; // Triệu VND
  const ltv = churnRate > 0 ? avgMRR / (churnRate / 100) : 0; // Triệu VND
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  const paybackMonths = avgMRR > 0 ? cac / avgMRR : 0;

  // Generate 12-Month Accumulation Projection
  const generateProjectionData = () => {
    const data = [];
    for (let month = 1; month <= 12; month++) {
      // Cumulative value of a customer portfolio accounting for monthly churn
      let cumulativeRevenue = 0;
      let activeCustomers = 100; // base cohort scale for visualization
      const costBasis = cac * 100; // cost to acquire 100 customers

      for (let m = 1; m <= month; m++) {
        cumulativeRevenue += activeCustomers * avgMRR;
        activeCustomers = activeCustomers * (1 - churnRate / 100);
      }

      data.push({
        month: `Tháng ${month}`,
        'Doanh thu lũy kế (100 KH)': Math.round(cumulativeRevenue),
        'Chi phí đầu tư ban đầu': Math.round(costBasis),
        'Dòng tiền ròng thu hồi': Math.round(cumulativeRevenue - costBasis)
      });
    }
    return data;
  };

  // Form Submission for CTA Variant
  const handleCreateCtaVariant = () => {
    if (!newCtaHeadline.trim() || !newCtaText.trim()) return;

    // Custom heuristic score calculation
    const keywordsUrgency = ['ngay', 'khẩn cấp', 'giới hạn', 'chỉ còn', 'dứt điểm', 'ngay hôm nay', 'free', 'miễn phí'];
    const keywordsClarity = ['phần mềm', 'kế toán', 'thuế', 'dùng thử', 'đăng ký', 'demo', 'tải về', 'bảng giá'];

    let urg = 4;
    let clar = 5;

    keywordsUrgency.forEach(kw => {
      if (newCtaHeadline.toLowerCase().includes(kw) || newCtaText.toLowerCase().includes(kw)) {
        urg += 1.5;
      }
    });
    keywordsClarity.forEach(kw => {
      if (newCtaHeadline.toLowerCase().includes(kw) || newCtaText.toLowerCase().includes(kw)) {
        clar += 1.5;
      }
    });

    urg = Math.min(Math.round(urg), 10);
    clar = Math.min(Math.round(clar), 10);
    const estCtr = parseFloat(((urg * 0.45) + (clar * 0.35) + 1.2).toFixed(1));

    const newCta: CTAVariant = {
      id: 'cta_' + Date.now(),
      headline: newCtaHeadline,
      ctaText: newCtaText,
      urgencyScore: urg,
      clarityScore: clar,
      estimatedCTR: estCtr
    };

    setCtaVariants([...ctaVariants, newCta]);
    setNewCtaHeadline('');
    setNewCtaText('');
  };

  // Select a preset hook
  const selectPresetHook = (hook: string) => {
    setNewCtaHeadline(hook);
  };

  // Form Submission for Event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim() || !newEventTrigger.trim()) return;

    const newEv: MicroEvent = {
      id: 'e_' + Date.now(),
      name: newEventName,
      trigger: newEventTrigger,
      weight: newEventWeight,
      count: 0,
      lastFired: 'Chưa kích hoạt'
    };

    setMicroEvents([...microEvents, newEv]);
    setNewEventName('');
    setNewEventTrigger('');
    setShowAddEvent(false);
  };

  const deleteEvent = (id: string) => {
    setMicroEvents(microEvents.filter(e => e.id !== id));
  };

  const handleExportExcel = () => {
    alert("Tính năng Xuất Excel: Đã mô phỏng kết xuất phân tích Funnel & CAC/LTV thành công ra định dạng .xlsx gửi xuống hệ thống LedgerFlow.");
  };

  return (
    <div className="bg-[#060b13]/80 border border-slate-900 rounded-3xl p-6 shadow-2xl relative select-text text-left" id="marketing-funnel-lab-container">
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>

      {/* HEADER AREA */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
              Phễu Chuyển Đổi & CRO Lab (Slide 84 Benchmark)
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
            <TrendingUp className="w-5.5 h-5.5 text-emerald-400" />
            Phòng Nghiên Cứu Hiệu Suất & Tối Ưu CRO (SME Funnel)
          </h2>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-2xl">
            Tối ưu hóa hành trình khách hàng từ lúc biết đến sản phẩm (TOFU) tới lúc ròng doanh thu giữ chân (Retention). Mô phỏng chỉ số CAC/LTV chuẩn tài chính khởi nghiệp.
          </p>
        </div>

        {/* SUB NAVIGATION TAB BAR */}
        <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-900">
          {[
            { id: 'funnel_builder', label: 'Bản Đồ Phễu', icon: Shuffle },
            { id: 'cac_ltv', label: 'CAC & LTV Lab', icon: Coins },
            { id: 'cta_tester', label: 'Thử Nghiệm CTA', icon: Megaphone },
            { id: 'micro_events', label: 'Sự Kiện Micro', icon: Target },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB CONTENTS */}

      {/* SUB-TAB 1: FUNNEL BUILDER WORKSPACE */}
      {activeSubTab === 'funnel_builder' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          {/* Top Performance Analytics Strip */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
              <span className="text-[10px] text-slate-500 font-black uppercase font-mono block">TỔNG LƯỢT TIẾP CẬN TẠI PHỄU (TOFU)</span>
              <p className="text-lg font-mono font-black text-purple-400 mt-1">{(funnelStages[0]?.visitors || 0).toLocaleString()} lượt</p>
              <span className="text-[10px] font-bold text-slate-450 block mt-0.5">Lượng truy cập hữu cơ từ Google & Referral</span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
              <span className="text-[10px] text-slate-500 font-black uppercase font-mono block">SỐ KHÁCH ĐÃ ĐẠT ĐƯỢC CHUYỂN ĐỔI CUỐI</span>
              <p className="text-lg font-mono font-black text-emerald-450 mt-1">{(funnelStages[funnelStages.length - 1]?.converted || 0).toLocaleString()} Khách hàng</p>
              <span className="text-[10px] font-bold text-slate-450 block mt-0.5">Gói trả phí thực tế hoặc kích hoạt trung thành</span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
              <span className="text-[10px] text-slate-500 font-black uppercase font-mono block">HIỆU SUẤT CHUYỂN ĐỔI TOÀN PHẦN (OVERALL CR)</span>
              <p className="text-lg font-mono font-black text-amber-500 mt-1">{overallConversionRate}%</p>
              <span className="text-[10px] font-bold text-slate-450 block mt-0.5">Mục tiêu trung bình ngành SaaS B2B: ~1.5 - 3%</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Left side: Stages visualization Kanban / Vertical line */}
            <div className="lg:col-span-7 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Trình Tạo Quy Trình Phễu Chuyển Đổi (Stage builder)</h3>
                  <p className="text-[11px] text-slate-500 font-semibold leading-normal">Quan sát lý do rò rỉ dòng người dùng tại từng điểm tiếp xúc để đưa ra đề xuất tối ưu code/copywriting.</p>
                </div>
                <button
                  onClick={() => setShowAddStage(!showAddStage)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Bước Phễu
                </button>
              </div>

              {showAddStage && (
                <form onSubmit={handleCreateStage} className="p-4 bg-slate-950 border border-emerald-900/40 rounded-2xl space-y-3.5 animate-slide-in">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Cấu hình bước phễu khách hàng mới</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">TÊN BƯỚC KHÁCH HÀNG ĐI QUA:</label>
                      <input 
                        type="text" 
                        value={newStageName} 
                        onChange={e => setNewStageName(e.target.value)} 
                        placeholder="Ví dụ: Đọc bảng giá..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white uppercase font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">PHÂN CẤP DOANH THU (STAGE CLASS):</label>
                      <select 
                        value={newStageLabel}
                        onChange={e => setNewStageLabel(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
                      >
                        <option value="TOFU">TOFU (Thu hút, nhận diện thương hiệu)</option>
                        <option value="MOFU">MOFU (Nuôi dưỡng, xem sản phẩm, dùng thử)</option>
                        <option value="BOFU">BOFU (Quyết định, thanh toán, kích hoạt)</option>
                        <option value="RETENTION">RETENTION (Gia hạn, nâng cấp gói)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">TRUY CẬP ĐẦU (VISITORS):</label>
                      <input 
                        type="number" 
                        value={newStageVisitors}
                        onChange={e => setNewStageVisitors(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">CHUYỂN ĐỔI THÀNH CÔNG (CONVERTED):</label>
                      <input 
                        type="number" 
                        value={newStageConverted}
                        onChange={e => setNewStageConverted(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">LÝ DO RỜI BỎ CHÍNH (DROP-OFF ROOT CAUSAL):</label>
                    <input 
                      type="text" 
                      value={newStageReason}
                      onChange={e => setNewStageReason(e.target.value)}
                      placeholder="Ví dụ: Quá nhiều trường bắt buộc khi đăng ký..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddStage(false)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs text-slate-400 rounded-xl"
                    >
                      Bỏ qua
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500"
                    >
                      Lưu và Tổng hợp
                    </button>
                  </div>
                </form>
              )}

              {/* STAGES LIST IN LAYOUT CARD */}
              <div className="space-y-3.5">
                {funnelStages.map((stage, idx) => {
                  const cr = stage.visitors > 0 ? ((stage.converted / stage.visitors) * 100) : 0;
                  const dropRate = 100 - cr;
                  return (
                    <div 
                      key={stage.id}
                      className="p-3 bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all relative overflow-hidden"
                    >
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-1" 
                        style={{ backgroundColor: stage.color }}
                      ></div>
                      
                      <div className="space-y-1.5 pl-3.5 text-left flex-1">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase font-mono"
                            style={{ backgroundColor: `${stage.color}15`, color: stage.color, border: `1px solid ${stage.color}25` }}
                          >
                            {stage.label}
                          </span>
                          <span className="text-xs font-black text-white">{stage.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold italic max-w-md">
                          💔 Cản trở (Drop-off): {stage.dropOffReason}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div className="font-mono text-[11px] space-y-0.5">
                          <div className="text-slate-400">
                            <strong>{stage.converted.toLocaleString()}</strong> / {stage.visitors.toLocaleString()} <span className="text-slate-600">t.click</span>
                          </div>
                          <div className="text-[9.5px]">
                            Chuyển đổi: <strong className="text-emerald-450">{cr.toFixed(1)}%</strong>
                          </div>
                        </div>

                        {cr < 25 && (
                          <span className="px-1.5 py-0.5 bg-rose-950/20 text-rose-400 border border-rose-900/30 rounded text-[9px] font-black uppercase font-mono flex items-center gap-0.5" title="Tỷ lệ chuyển đổi ở bước hàng thấp hơn trung bình ngành!">
                            <AlertCircle className="w-3 h-3 text-rose-400" /> Nguy cấp
                          </span>
                        )}

                        <button
                          onClick={() => deleteStage(stage.id)}
                          className="p-1.5 bg-slate-900 hover:text-rose-400 border border-slate-800 rounded-lg transition-all cursor-pointer"
                          title="Xóa bước phễu này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Recharts vertical chart */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Tv className="w-4.5 h-4.5 text-emerald-400" />
                  Mô hình Phễu Co hẹp Dần (Visualizing)
                </h3>
                <button
                  onClick={handleExportExcel}
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  XLSX
                </button>
              </div>

              {/* Chart container */}
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={calculateFunnelGraphData()}
                    margin={{ top: 10, right: 10, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" stroke="#475569" fontSize={9} />
                    <YAxis dataKey="name" type="category" stroke="#475569" fontSize={8} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '11px' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="Lượt truy cập" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                      {
                        funnelStages.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Key Conversion Rate Progression Chart */}
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl text-[10.5px] leading-relaxed text-left font-semibold space-y-1.5">
                <span className="text-[9px] text-slate-500 font-black block uppercase font-mono mb-1">Chiến thuật khắc phục rò rỉ:</span>
                <p className="text-slate-300">
                  ⚡ <strong>Nâng cấp TOFU → MOFU:</strong> Tạo tiêu đề CTA sắc bén (A/B Test) và tinh lọc tệp đối tượng Facebook Custom Audiences từ hệ thống CRM.
                </p>
                <p className="text-slate-300">
                  ⚙️ <strong>Nắm rõ BOFU → Retention:</strong> Sử dụng hệ thống Zalo ZNS tự động gửi mẫu hạch toán VAT/CIT để gia tăng lòng tin và mức độ thỏa mãn trong 15 ngày trải nghiệm.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CAC & LTV CALCULATOR */}
      {activeSubTab === 'cac_ltv' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Input fields panel */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  Unit Economics Input
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Coins className="w-4.5 h-4.5 text-emerald-400" />
                  Thông số Chi phí & Doanh thu
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Thiết lập các biến số chi tiêu quảng cáo, phí vận hành để tính toán dòng tiền thu về của một đơn vị khách hàng SME.
                </p>
              </div>

              {/* Input controllers */}
              <div className="space-y-4 pt-2">
                
                {/* Total Cost */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase font-mono text-slate-400">
                    <span>Tổng ngân sách marketing tháng (tr VNĐ):</span>
                    <span className="text-purple-400 font-extrabold">{marketingCost} triệuđ</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={marketingCost}
                    onChange={e => setMarketingCost(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {/* New Acquisitions */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase font-mono text-slate-400">
                    <span>Số lượng KH đăng ký mới đạt được:</span>
                    <span className="text-emerald-450 font-extrabold">{newAcquisitions} Người</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={newAcquisitions}
                    onChange={e => setNewAcquisitions(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {/* Avg MRR */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase font-mono text-slate-400">
                    <span>Doanh thu trung bình tháng/KH (MRR):</span>
                    <span className="text-amber-500 font-extrabold">{avgMRR} triệu VNĐ</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={avgMRR}
                    onChange={e => setAvgMRR(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {/* Monthly Churn */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase font-mono text-slate-400">
                    <span>Tỷ lệ hủy gia hạn hợp đồng (M. Churn):</span>
                    <span className="text-red-450 font-extrabold">{churnRate}% / tháng</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={churnRate}
                    onChange={e => setChurnRate(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Calculations & Chart outputs */}
            <div className="lg:col-span-7 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 space-y-6">
              
              {/* Performance Indicator Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-2xl text-left">
                  <span className="text-[9px] text-slate-500 font-black uppercase font-mono block">CHI PHÍ ACQUISITION (CAC)</span>
                  <p className="text-lg font-mono font-black text-rose-455 text-rose-450 mt-0.5">{(cac * 1000).toFixed(0)}k <span className="text-[9px] text-slate-500">đ/KH</span></p>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-2xl text-left">
                  <span className="text-[9px] text-slate-500 font-black uppercase font-mono block">GIÁ TRỊ VÒNG ĐỜI (LTV)</span>
                  <p className="text-lg font-mono font-black text-emerald-450 mt-0.5">{ltv.toFixed(1)}M <span className="text-[9px] text-slate-500">đ/KH</span></p>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-2xl text-left">
                  <span className="text-[9px] text-slate-500 font-black uppercase font-mono block">TỶ LỆ LTV / CAC RATIO</span>
                  <p className={`text-lg font-mono font-black mt-0.5 ${ltvCacRatio >= 3 ? 'text-emerald-450' : 'text-rose-400'}`}>{ltvCacRatio.toFixed(1)}x</p>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-2xl text-left">
                  <span className="text-[9px] text-slate-500 font-black uppercase font-mono block">THỜI GIAN HÒA VỐN (PAYBACK)</span>
                  <p className="text-lg font-mono font-black text-amber-500 mt-0.5">{paybackMonths.toFixed(1)} <span className="text-[9px] text-slate-500">tháng</span></p>
                </div>
              </div>

              {/* Dynamic Health Feedback */}
              <div className="p-3.5 rounded-2xl flex items-start gap-2.5 text-[11px] font-semibold leading-normal">
                {ltvCacRatio < 3 ? (
                  <div className="bg-rose-500/5 text-rose-400 border border-rose-500/10 p-3 rounded-xl w-full flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      ⚡ <strong>Cảnh báo phân khúc: Tỷ suất LTV/CAC rủi ro ({ltvCacRatio.toFixed(1)}x &lt; 3x)</strong><br />
                      Chi phí thu được khách hàng quá cao hoặc tỷ lệ churn hủy gia hạn quá nghiêm trọng ({churnRate}%). Doanh nghiệp đang tiêu hơn mức sinh lợi. Hãy kéo giảm CAC bằng organic SEO hoặc tối ưu trang Landing Page dứt điểm!
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/5 text-emerald-300 border border-emerald-500/10 p-3 rounded-xl w-full flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      💎 <strong>Xếp hạng ưu tú: Tỷ suất LTV/CAC tối ưu bền vững ({ltvCacRatio.toFixed(1)}x ≥ 3x)</strong><br />
                      Hệ thống vận hành marketing đang sinh khí vững chắc. Mỗi đồng bỏ ra chạy quảng cáo mang lại lũy kế doanh thu gấp {ltvCacRatio.toFixed(1)} lần. Bạn có cơ hội mở quy mô ngân sách (scale-up) ngay để giành thị phần.
                    </div>
                  </div>
                )}
              </div>

              {/* Accumulation Graph projection */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wider font-sans">DỰ BÁO LŨY KẾ DOANH THU & ĐIỂM HÒA VỐN (THỜI KỲ 12 THÁNG)</h4>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={generateProjectionData()}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <XAxis dataKey="month" stroke="#475569" fontSize={9} />
                      <YAxis stroke="#475569" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '12px' }} />
                      <Legend fontSize={10} wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="Doanh thu lũy kế (100 KH)" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Chi phí đầu tư ban đầu" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="Dòng tiền ròng thu hồi" stroke="#8b5cf6" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CTA TESTER & HOOKS LAB */}
      {activeSubTab === 'cta_tester' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Left side: Variant Creator & Pre-defined Copy library */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  Copywriting Benchmarks
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-purple-400" />
                  Trình Thử Nghiệm Thông Điệp CTA
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Soạn thử các câu headline hoặc nút bấm để bộ quét AI nhận định mức độ rõ nét (Clarity) và khẩn cấp (Urgency) tự động.
                </p>
              </div>

              {/* Form Input fields */}
              <div className="space-y-3 pt-1">
                <div className="text-left">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">TIÊU ĐỀ HEADLINE KÊU GỌI:</label>
                  <input
                    type="text"
                    value={newCtaHeadline}
                    onChange={e => setNewCtaHeadline(e.target.value)}
                    placeholder="Ví dụ: Quyết toán thuế 0đ lỗi tốn chi phí ròng..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="text-left">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">NẮP NÚT BẤM KÍCH HOẠT (CTA BUTTON):</label>
                  <input
                    type="text"
                    value={newCtaText}
                    onChange={e => setNewCtaText(e.target.value)}
                    placeholder="Ví dụ: Kích hoạt dùng thử ngay..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateCtaVariant}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Đánh giá & Thêm Phương án
                </button>
              </div>

              {/* Copy library presets */}
              <div className="space-y-2 pt-2 border-t border-slate-900">
                <span className="text-[9px] text-slate-500 font-black block uppercase font-mono">THƯ VIỆN HOOKS TIẾNG VIỆT ĐỀ XUẤT</span>
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {HOOK_LIBRARY.map((hook, hidx) => (
                    <div 
                      key={hidx} 
                      onClick={() => selectPresetHook(hook)}
                      className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-purple-900/35 rounded-lg cursor-pointer transition-all text-slate-300 font-semibold"
                    >
                      💡 {hook}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: Variants list and comparison bars */}
            <div className="lg:col-span-7 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Bảng Đối Chiếu Chỉ Số Thống Kê Thử Nghiệm Đa Biến (A/B Test)
              </h3>

              <div className="space-y-4">
                {ctaVariants.map((v, vidx) => (
                  <div key={v.id} className="p-3.5 bg-slate-950 border border-slate-900 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[9px] text-purple-400 font-black font-mono uppercase">PHƯƠNG ÁN {vidx + 1}</span>
                        <h4 className="text-[11.5px] font-bold text-white leading-normal">"{v.headline}"</h4>
                      </div>
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-mono font-bold text-[10px]">
                        {v.estimatedCTR}% CTR
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] font-bold text-slate-500 uppercase font-mono">NÚT BẤM (BUTTON):</span>
                      <span className="px-2.5 py-1 bg-purple-600/15 border border-purple-500/30 text-white rounded-lg text-[10.5px] font-extrabold max-w-xs truncate">
                        {v.ctaText}
                      </span>
                    </div>

                    {/* Score bars indicators */}
                    <div className="grid sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-900/60 font-mono text-[10px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Chỉ số kêu gọi gấp gáp (Urgency):</span>
                          <span>{v.urgencyScore}/10</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${v.urgencyScore * 10}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Độ cụ thể rõ ràng (Clarity):</span>
                          <span>{v.clarityScore}/10</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: `${v.clarityScore * 10}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 4: MICRO-EVENTS MONITOR */}
      {activeSubTab === 'micro_events' && (
        <div className="space-y-6 mt-6 animate-fade-in text-left">
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Form Creator Left side */}
            <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
              <div className="space-y-1 text-left">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider block w-max font-mono">
                  Event Streaming Settings
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Target className="w-4.5 h-4.5 text-emerald-400" />
                  Cấu Hình Chỉ Số Hành Vi
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Thiết lập điểm tích lũy hành vi (Micro-conversions) để hệ thống tự lọc ra những Lead "Hot" sẵn sàng mua hàng nhất hằng ngày.
                </p>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3.5 pt-1 text-left">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">TÊN CHỈ TIÊU HOẠT ĐỘNG (EVENT NAME):</label>
                  <input
                    type="text"
                    value={newEventName}
                    onChange={e => setNewEventName(e.target.value)}
                    placeholder="Ví dụ: Đọc trang điều khoản, Soạn thử nợ..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono">ĐIỀU KIỆN KÍCH HOẠT (TRIGGER FILTER):</label>
                  <input
                    type="text"
                    value={newEventTrigger}
                    onChange={e => setNewEventTrigger(e.target.value)}
                    placeholder="Ví dụ: Click css selector banner-gold..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white uppercase font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase font-mono flex justify-between">
                    <span>ĐIỂM LIÊN ĐỚI LEAD SCORING (WEIGHT):</span>
                    <strong className="text-emerald-400 font-mono">{newEventWeight} điểm</strong>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={newEventWeight}
                    onChange={e => setNewEventWeight(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Xác lập Event Tracker
                </button>
              </form>
            </div>

            {/* Grid Table Display Events */}
            <div className="lg:col-span-8 bg-slate-950/30 border border-slate-900 rounded-3xl p-5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Môi trường Giám sát Sự kiện hoạt động người dùng trong 24h
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[10px] font-mono">
                      <th className="pb-3 pl-2">Tên Chỉ tiêu hành vi</th>
                      <th className="pb-3">Cú pháp Event Trigger</th>
                      <th className="pb-3 text-right">Cộng điểm (Weight)</th>
                      <th className="pb-3 text-right">Lượt bắn trong 24h</th>
                      <th className="pb-3 text-right">Thời điểm cuối cùng</th>
                      <th className="pb-3 text-center">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {microEvents.map(e => (
                      <tr key={e.id} className="border-b border-slate-900/40 hover:bg-slate-900/20 transition-all">
                        <td className="py-2.5 pl-2 font-extrabold text-white">{e.name}</td>
                        <td className="py-2.5 font-mono text-[9px] text-purple-400 overflow-hidden text-ellipsis max-w-[150px]">
                          {e.trigger}
                        </td>
                        <td className="py-2.5 text-right font-mono font-extrabold text-emerald-450">
                          +{e.weight} điểm
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-white">
                          {e.count > 0 ? `${e.count.toLocaleString()} lần` : '—'}
                        </td>
                        <td className="py-2.5 text-right font-mono text-[10px] text-slate-500">
                          {e.lastFired}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => deleteEvent(e.id)}
                            className="p-1.5 bg-slate-900 hover:text-rose-450 border border-slate-800 rounded-lg transition-all cursor-pointer"
                            title="Xóa sự kiện này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
