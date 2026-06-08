import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { BUSINESS_IDEAS } from '../data/businessIdeas';
import { BusinessIdea, FinancialForecastInput } from '../types';
import { 
  Calculator, Award, ShieldAlert, CheckCircle2, TrendingUp, HelpCircle, Briefcase, 
  DollarSign, Users, Sparkles, Database, Server, Cpu, Cloud, Check, ArrowRight,
  BrainCircuit, LayoutDashboard, Compass
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

export default function SoloFounderBusiness() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [activeTab, setActiveTab2] = useState<'ideas' | 'calc' | 'handbook' | 'free_tier' | 'tracker'>('ideas');

  // Interactive Learning Progress checklist states for Vietnamese learners
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({
    mod_1_ideas: true, // Start with some completed default
    mod_2_financials: false,
    mod_3_roadmap: false,
    mod_4_datascience: false,
    mod_5_prompts: false,
    mod_6_gemini: false,
    mod_7_sandbox: false,
    mod_8_ecosystem: false,
    mod_9_game_ml: false,
  });

  const toggleModule = (id: string) => {
    setCompletedModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Build interactive chart database based on selected/completed items
  const getRadarData = () => {
    return [
      { subject: 'Ý tưởng & Concept', A: completedModules.mod_1_ideas ? 95 : 20, B: 100 },
      { subject: 'Tài chính & Pháp lý', A: completedModules.mod_2_financials ? 90 : 15, B: 100 },
      { subject: 'Lập trình Web (Roadmap)', A: completedModules.mod_3_roadmap ? 85 : 10, B: 100 },
      { subject: 'Data Science & FinLab', A: completedModules.mod_4_datascience ? 90 : 15, B: 100 },
      { subject: 'Kỹ nghệ AI Prompts', A: completedModules.mod_5_prompts ? 95 : 25, B: 100 },
      { subject: 'Tích hợp Gemini API', A: completedModules.mod_6_gemini ? 90 : 10, B: 100 },
      { subject: 'SQL & Sandbox', A: completedModules.mod_7_sandbox ? 85 : 10, B: 100 },
      { subject: 'Sơ đồ & Quy trình AI', A: completedModules.mod_8_ecosystem ? 95 : 20, B: 100 },
      { subject: 'Game Mobile & ML', A: completedModules.mod_9_game_ml ? 90 : 10, B: 100 },
    ];
  };

  const { activeIdea } = useStore();

  // Python Sandbox State (to track completed Python tutorials)
  
  // Free Tier Optimizer state
  const [selectedDb, setSelectedDb] = useState<'sqlite' | 'supabase' | 'neon' | 'rds'>('supabase');
  const [selectedHost, setSelectedHost] = useState<'vercel' | 'render' | 'huggingface' | 'vps'>('vercel');
  const [selectedPython, setSelectedPython] = useState<'streamlit' | 'local' | 'cloud_run'>('streamlit');
  const [selectedAi, setSelectedAi] = useState<'gemini_free' | 'gemini_pay' | 'openai'>('gemini_free');
  const [selectedNotify, setSelectedNotify] = useState<'telegram' | 'discord' | 'twilio'>('telegram');

  // Calculator State
  const [forecast, setForecast] = useState<FinancialForecastInput>({
    setupFee: 5000000, // setup fee VND
    monthlyRevenue: activeIdea?.pricePoint || 35000, // retrieve from activeIdea
    targetClients: 200,
    cac: 15000, // CAC in VND
    itCost: 0, // setup 0đ
    miscCost: 150000, // other
    expansionRate: 15 // yearly growth %
  });

  // Sync with activeIdea of useStore
  useEffect(() => {
    if (activeIdea) {
      setForecast(prev => ({
        ...prev,
        monthlyRevenue: activeIdea.pricePoint,
        // Make the targets and costs look highly relevant to the product model:
        setupFee: activeIdea.type === 'saas' ? 0 : 2000000,
        targetClients: activeIdea.type === 'game' ? 1000 : 250,
        cac: activeIdea.type === 'game' ? 5000 : 25000,
        itCost: 0, // emphasize our 0đ server stack!
      }));
    }
  }, [activeIdea]);

  const categories = ['Tất cả', ...Array.from(new Set(BUSINESS_IDEAS.map(idea => idea.category)))];

  const filteredIdeas = selectedCategory === 'Tất cả' 
    ? BUSINESS_IDEAS 
    : BUSINESS_IDEAS.filter(idea => idea.category === selectedCategory);

  // Financial calculations
  const totalSetupRevenue = forecast.setupFee * forecast.targetClients;
  const monthlyRecurringRevenue = forecast.monthlyRevenue * forecast.targetClients;
  const monthlyOperationalCost = forecast.itCost + forecast.miscCost;
  const monthlyProfit = monthlyRecurringRevenue - monthlyOperationalCost;
  const initialCACInvestment = forecast.cac * forecast.targetClients;
  const grossMargin = monthlyRecurringRevenue > 0 
    ? ((monthlyProfit) / monthlyRecurringRevenue) * 100 
    : 0;

  // LTV (Assuming an average customer lifetime of 18 months)
  const customerLTV = (forecast.monthlyRevenue * 18) + forecast.setupFee;
  const ltvToCacRatio = forecast.cac > 0 ? (customerLTV / forecast.cac) : 0;

  // Months to Break-Even on CAC + Setup costs (if any)
  const breakevenMonths = monthlyProfit > 0 
    ? Math.max(0, parseFloat((initialCACInvestment / monthlyProfit).toFixed(1))) 
    : Infinity;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const getLtvStatus = (ratio: number) => {
    if (ratio >= 5) return { text: 'Tuyệt vời', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    if (ratio >= 3) return { text: 'Khỏe mạnh (Lý tưởng)', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    if (ratio >= 1.5) return { text: 'Chấp nhận được', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    return { text: 'Nguy hiểm (Cần tối ưu)', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
  };

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex flex-col sm:flex-row border-b border-slate-800 bg-slate-900/60 p-1 rounded-xl gap-1 sm:gap-0">
        <button
          onClick={() => setActiveTab2('ideas')}
          className={`flex items-center gap-2 flex-1 py-3 text-center justify-center rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'ideas' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4 shrink-0" />
          <span>10 Cơ Hội Solo Founder</span>
        </button>
        <button
          onClick={() => setActiveTab2('calc')}
          className={`flex items-center gap-2 flex-1 py-3 text-center justify-center rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'calc' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calculator className="w-4 h-4 shrink-0" />
          <span>Bảng Tính Tài Chính</span>
        </button>
        <button
          onClick={() => setActiveTab2('handbook')}
          className={`flex items-center gap-2 flex-1 py-3 text-center justify-center rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'handbook' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Pháp Lý & Vận Hành</span>
        </button>
        <button
          onClick={() => setActiveTab2('free_tier')}
          className={`flex items-center gap-2 flex-1 py-3 text-center justify-center rounded-lg text-xs sm:text-sm font-bold transition-all border ${
            activeTab === 'free_tier' 
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
              : 'text-slate-400 hover:text-emerald-400 bg-slate-950/20 hover:bg-slate-900/40 border-transparent'
          }`}
        >
          <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Bản Đồ Chi Phí 0đ 🌟</span>
        </button>
        <button
          onClick={() => setActiveTab2('tracker')}
          className={`flex items-center gap-2 flex-1 py-3 text-center justify-center rounded-lg text-xs sm:text-sm font-bold transition-all border ${
            activeTab === 'tracker' 
              ? 'bg-indigo-600 border-indigo-505 text-white shadow-lg shadow-indigo-500/20' 
              : 'text-slate-400 hover:text-indigo-400 bg-slate-950/20 hover:bg-slate-900/40 border-transparent'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>La Bàn Kỹ Năng 🎯</span>
        </button>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'ideas' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-purple-500" />
                Sản phẩm hóa dịch vụ (Productized Services)
              </h3>
              <p className="text-slate-400 text-sm">Điểm ngọt cho Solo Founder kỹ năng lai: Kế toán + Phân tích dữ liệu + Lập trình.</p>
            </div>
            {/* Category selection */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedCategory === cat 
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredIdeas.map(idea => (
              <div key={idea.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-800 text-purple-400 border border-slate-700 rounded-md">
                      {idea.category}
                    </span>
                    <span className="text-xs text-slate-400 italic">
                      {idea.priceModel}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-3 mb-2">{idea.title}</h4>
                  <p className="text-xs text-slate-400 mb-4 font-medium">
                    <span className="text-slate-500 font-semibold">Khách hàng mục tiêu: </span>
                    {idea.targetClient}
                  </p>

                  <div className="space-y-2 border-t border-slate-800/80 pt-3">
                    <p className="text-xs font-bold text-slate-300">Tính năng MVP tối thiểu:</p>
                    <ul className="text-xs text-slate-400 space-y-1.5">
                      {idea.minViableFeatures.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500 block">Setup trung bình</span>
                    <span className="font-bold text-slate-200">{formatVND(idea.initialCost)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block">Duy trì hàng tháng</span>
                    <span className="font-bold text-emerald-400">{formatVND(idea.monthlyFee)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'calc' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* SLIDERS INPUT */}
          <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 space-y-6 lg:col-span-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="text-purple-500" />
              Thông tin Dự phóng
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Phí Setup khởi điểm (VNĐ)</label>
                <input 
                  type="number" 
                  value={forecast.setupFee} 
                  onChange={e => setForecast({...forecast, setupFee: Number(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
                />
                <span className="text-[10px] text-slate-500">Mức setup trung bình: 10,000,000đ - 25,000,000đ</span>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Mức duy trì / Retainer hàng tháng (VNĐ)</label>
                <input 
                  type="number" 
                  value={forecast.monthlyRevenue} 
                  onChange={e => setForecast({...forecast, monthlyRevenue: Number(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
                />
                <span className="text-[10px] text-slate-500">Mức retainer trung bình cho SME: 3,000,000đ - 8,000,000đ</span>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Số lượng khách hàng mục tiêu</label>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={forecast.targetClients} 
                  onChange={e => setForecast({...forecast, targetClients: Number(e.target.value)})}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-slate-400 font-semibold">
                  <span>1 KH</span>
                  <span className="text-purple-400 font-bold">{forecast.targetClients} Khách hàng</span>
                  <span>50 KH</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Chi phí thu hút 1 khách hàng - CAC (VNĐ)</label>
                <input 
                  type="number" 
                  value={forecast.cac} 
                  onChange={e => setForecast({...forecast, cac: Number(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Chi phí hosting, API & phần mềm / tháng (VNĐ)</label>
                <input 
                  type="number" 
                  value={forecast.itCost} 
                  onChange={e => setForecast({...forecast, itCost: Number(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Chi phí vận hành khác / tháng (VNĐ)</label>
                <input 
                  type="number" 
                  value={forecast.miscCost} 
                  onChange={e => setForecast({...forecast, miscCost: Number(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* CALCULATED RESULTS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Award className="text-emerald-500" />
                  Chỉ số Sức Khỏe Tài Chính Dự Dự Báo
                </span>
                <span className="text-xs text-slate-500 font-normal">Tháng 5/2026</span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80">
                  <span className="text-xs text-slate-400">Doanh thu lặp lại (MRR)</span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{formatVND(monthlyRecurringRevenue)}</p>
                  <span className="text-[10px] text-slate-500">Giả định với {forecast.targetClients} Khách hàng duy trì</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80">
                  <span className="text-xs text-slate-400">Thiết lập ban đầu (Một lần)</span>
                  <p className="text-2xl font-bold text-purple-400 mt-1">{formatVND(totalSetupRevenue)}</p>
                  <span className="text-[10px] text-slate-500">Tổng phí setup nhận được</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80">
                  <span className="text-xs text-slate-400">Biên lợi nhuận gộp hàng tháng</span>
                  <p className="text-2xl font-bold text-white mt-1">
                    {grossMargin.toFixed(1)}%
                  </p>
                  <span className="text-[10px] text-slate-500">Chi phí vận hành: {formatVND(monthlyOperationalCost)}/tháng</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80">
                  <span className="text-xs text-slate-400">Giá trị trọn đời KH (LTV) / CAC</span>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold text-yellow-400">{ltvToCacRatio.toFixed(1)}x</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getLtvStatus(ltvToCacRatio).color}`}>
                      {getLtvStatus(ltvToCacRatio).text}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">LTV trung bình 1 KH: {formatVND(customerLTV)}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-850/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-bold block mb-1">Thời gian thu hồi vốn đầu tư (CAC Payback Period)</span>
                    <p className="text-xl font-bold text-slate-200">
                      {breakevenMonths === Infinity 
                        ? 'Không thể hòa vốn (Dãy số âm)' 
                        : breakevenMonths === 0 
                        ? 'Hòa vốn lập tức' 
                        : `${breakevenMonths} tháng`}
                    </p>
                    <span className="text-[10px] text-slate-500">Tổng đầu tư setup & tìm khách hàng ban đầu: {formatVND(initialCACInvestment)}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col items-center justify-center min-w-[140px]">
                    <span className="text-[10px] text-slate-500 font-semibold md:mb-1">Lợi nhuận ròng năm phát triển</span>
                    <span className="text-md font-extrabold text-emerald-400">
                      {formatVND((monthlyProfit * 12) + totalSetupRevenue - initialCACInvestment)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80">
              <h4 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">💡 Đánh giá điều tiết từ chuyên gia:</h4>
              <div className="space-y-2 text-xs text-slate-400">
                <p>
                  1. Với tỷ số <strong className="text-slate-200">LTV/CAC = {ltvToCacRatio.toFixed(1)}x</strong>, {ltvToCacRatio >= 3 ? 'mô hình kinh doanh của bạn hoàn toàn khả thi và có biên lợi nhuận tuyệt vời cho Solo Founder.' : 'bạn đang tiêu tốn quá nhiều tiền vào việc tìm kiếm khách hàng so với doanh thu bạn nhận lại. Hãy tìm hiểu kênh hợp tác và truyền miệng (Ref) để cắt bớt CAC.'}
                </p>
                <p>
                  2. Với dòng tiền thu ròng lũy tiến hàng tháng là <strong className="text-emerald-400">{formatVND(monthlyProfit)}</strong>, bạn hoàn toàn có thể tích trữ ngân sách để thuê cộng tác viên (Contractor) hỗ trợ bớt dồn dập việc từ tháng thứ 5 mà vẫn giữ được tính chất gọn nhẹ của mô hình Solo Founder.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'handbook' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-md font-bold text-white">Sổ Tay Vận Hành & Pháp Lý Cho Solo Founder Việt Nam</h3>
              <p className="text-slate-400 text-xs">Mọi mô hình tài giỏi đều sụp đổ nếu bạn định vị sai pháp lý và phạm luật kinh doanh kế toán.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Rủi ro Pháp lý: Cảnh giác "Kinh doanh có điều kiện"
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tại Việt Nam, <strong>Dịch vụ Kế toán</strong> và <strong>Đại lý Thuế</strong> thuộc diện kinh doanh có điều kiện cực kỳ khắt khe của Luật kế toán 88/2015/QH13. Doanh nghiệp làm dịch vụ kế toán bắt buộc phải có ít nhất hai kế toán viên hành nghề đã có chứng chỉ hành nghề của Bộ tài chính cấp. 
                <br /><br />
                Đồng thời phải đóng quỹ trách nhiệm nghề nghiệp đầy đủ. Do đó, nếu bạn chưa có chứng chỉ hành nghề hoặc làm một mình, <strong>TUYỆT ĐỐI KHÔNG</strong> định vị công ty là "Dịch vụ kế toán trọn gói" hay đại lý ký duyệt sổ sách thay doanh nghiệp.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Lộ Trình Tránh Bẫy: "Software-as-a-Service Lite"
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cách đi đúng, an toàn của một Solo Founder rành công nghệ là định vị dịch vụ thuộc lớp: <strong>"Cung cấp phần mềm, setup quy trình, dọn dẹp kiểm định dữ liệu thô và dựng Dashboard báo cáo quản trị nội bộ"</strong>.
                <br /><br />
                Bạn chỉ đảm nhận kiểm soát, gỡ lỗi dữ liệu bị lệch từ POS, QR thanh toán, bank sao kê để làm "Dữ liệu sạch", phục vụ việc chốt số. Còn sổ sách cuối kỳ và kê khai đại diện trước Thuế vẫn do chính kế toán trưởng nội bộ của họ chịu trách nhiệm. Bằng cách này bạn tối đa hóa giá trị chuyên sâu (phần việc mệt mỏi nhất doanh nghiệp lười làm) mà không vướng rào cản pháp lý điều kiện.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">📋 Các mô hình hợp tác tối ưu thuế & pháp lý phổ biến:</h4>
            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <span className="font-bold text-slate-200 block mb-1">1. Hợp tác với Đại lý Thuế</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">Bạn làm Data pipelines, dọn dẹp hóa đơn sạch. Đại lý thuế do bạn liên kết đứng ra ký chứng thực và tờ khai pháp lý, chia theo tỷ lệ.</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <span className="font-bold text-slate-200 block mb-1">2. Embedded Reseller</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">Bán dashboard, bot nhắc việc như một add-on tích hợp của các đơn vị triển khai phần mềm POS, ERP có tệp khách khổng lồ có sẵn.</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <span className="font-bold text-slate-200 block mb-1">3. Triển khai & Chẩn đoán độc lập</span>
                <span className="text-slate-400 text-[11px] leading-relaxed">Bán phần mềm, file tự động hóa Excel / Python, template báo cáo quản trị kèm cam kết NDA bảo mật dữ liệu, không đại diện hạch toán thuế.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'free_tier' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950/20 via-[#0a1a15] to-teal-950/25 border border-emerald-900/40 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-emerald-500/5 blur-2xl"></div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Cloud className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-2">
                    ⚡ CHIẾN LƯỢC HẠ TẦNG 0đ (Zero-Operating Cost Stack)
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black rounded font-mono">OPT-ZERO CAPITAL</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-4xl font-semibold">
                    Làm sao để một Solo Founder vận hành hệ thống dọn dẹp data, đồng bộ sổ sách, và lưu trữ SQL Sổ cái cho hàng chục khách hàng tại Việt Nam mà <strong>không tốn một đồng chi phí máy chủ hàng tháng</strong>? Hãy tự thiết lập cấu hình của bạn dưới đây để kiểm chứng giải pháp tối giản!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Interactive Selector Column */}
            <div className="lg:col-span-2 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 border-b border-slate-850 pb-2.5 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-400" />
                Tùy Chọn Lắp Ghép Hạ Tầng Cloud & Trình Dữ Liệu
              </h3>

              {/* 1. Database Selector */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold flex justify-between">
                  <span>1. Cơ sở dữ liệu (Database Store):</span>
                  <span className="text-emerald-400 font-mono font-black">
                    {selectedDb === 'sqlite' || selectedDb === 'supabase' || selectedDb === 'neon' ? '0đ (Free Tier)' : '350.000đ/tháng'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sqlite', name: 'SQLite (Local embedded)', desc: '0đ / Không giới hạn bộ nhớ cục bộ' },
                    { id: 'supabase', name: 'Supabase Postgres', desc: '0đ Free Tier / 500MB DB sịn sò' },
                    { id: 'neon', name: 'Neon Serverless', desc: '0đ / Postgres tự động co giãn' },
                    { id: 'rds', name: 'Cloud SQL / RDS', desc: '350.000đ / Instance chuyên biệt' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedDb(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedDb === item.id 
                          ? 'bg-emerald-500/10 border-emerald-500/80 ring-1 ring-emerald-500/30' 
                          : 'bg-slate-950/80 border-slate-850 hover:bg-slate-900 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold block text-white">{item.name}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Web Hosting / API */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold flex justify-between">
                  <span>2. Web Hosting & Logic API (Node/TS Server):</span>
                  <span className="text-emerald-400 font-mono font-black">
                    {selectedHost === 'vps' ? '120.000đ/tháng' : '0đ (Hobby Free Tier)'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'vercel', name: 'Vercel Serverless', desc: '0đ / Phản hồi API cực nhanh, CDN tối lo' },
                    { id: 'render', name: 'Render Free Services', desc: '0đ / Tự khởi động lại nếu rảnh 15p' },
                    { id: 'huggingface', name: 'HuggingFace Spaces', desc: '0đ / Host app Docker + Machine Learning' },
                    { id: 'vps', name: 'VPS Linux riêng', desc: '120.000đ / VPS 2GB RAM hạ tầng Việt Nam' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedHost(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedHost === item.id 
                          ? 'bg-emerald-500/10 border-emerald-500/80 ring-1 ring-emerald-500/30' 
                          : 'bg-slate-950/80 border-slate-850 hover:bg-slate-900 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold block text-white">{item.name}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Python Data & Processing */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold flex justify-between">
                  <span>3. Trình Python dọn dẹp Pandas & Streamlit (Dashboard):</span>
                  <span className="text-emerald-400 font-mono font-black">
                    {selectedPython === 'cloud_run' ? '180.000đ/tháng' : '0đ (Miễn Phí)'}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'streamlit', name: 'Streamlit Cloud', desc: '0đ / Ghép file an toàn' },
                    { id: 'local', name: 'Chạy Python Máy Cục Bộ', desc: '0đ / Xuất Excel gửi mail' },
                    { id: 'cloud_run', name: 'GCP Cloud Run', desc: '180.000đ / Auto Scale' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedPython(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPython === item.id 
                          ? 'bg-emerald-500/10 border-emerald-500/80 ring-1 ring-emerald-500/30' 
                          : 'bg-slate-950/80 border-slate-850 hover:bg-slate-900 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold block text-white">{item.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. AI Engine */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold flex justify-between">
                  <span>4. Trí tuệ AI bóc tách nội dung hóa đơn (OCR & NLP parser):</span>
                  <span className="text-emerald-400 font-mono font-black">
                    {selectedAi === 'gemini_free' ? '0đ (Free API Key)' : selectedAi === 'gemini_pay' ? '50.000đ (Pay-as-you-go)' : '200.000đ / tháng'}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gemini_free', name: 'Gemini 1.5/2.0 Free Key', desc: '0đ / Tới 15 request/phút' },
                    { id: 'gemini_pay', name: 'Gemini Billing', desc: '50.000đ / Theo token' },
                    { id: 'openai', name: 'OpenAI API Token', desc: '200.050đ / Đăng ký cứng' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedAi(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedAi === item.id 
                          ? 'bg-emerald-500/10 border-emerald-500/80 ring-1 ring-emerald-500/30' 
                          : 'bg-slate-950/80 border-slate-850 hover:bg-slate-900 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold block text-white">{item.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Notification & Audit System */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold flex justify-between">
                  <span>5. Kênh thông báo cảnh báo dòng tiền cho Chủ doanh nghiệp:</span>
                  <span className="text-emerald-400 font-mono font-black">
                    {selectedNotify === 'twilio' ? '150.000đ/tháng' : '0đ / Miễn Phí'}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'telegram', name: 'Telegram Bot API', desc: '0đ / Không giới hạn tin nhắn' },
                    { id: 'discord', name: 'Discord Webhook', desc: '0đ / Không giới hạn API' },
                    { id: 'twilio', name: 'Zalo ZNS / Twilio SMS', desc: '150.000đ / Theo phí viễn thông' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedNotify(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedNotify === item.id 
                          ? 'bg-emerald-500/10 border-emerald-500/80 ring-1 ring-emerald-500/30' 
                          : 'bg-slate-950/80 border-slate-850 hover:bg-slate-900 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold block text-white">{item.name}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Calculator & Practical Rules */}
            <div className="space-y-6 lg:col-span-1">
              {/* Box Cost Evaluator card */}
              <div className="bg-[#050e12] border border-emerald-900/40 p-5 rounded-2xl text-center space-y-4 shadow-xl">
                <div>
                  <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest block">CHI PHÍ VẬN HÀNH THỰC TẾ</span>
                  <p className="text-3xl font-black text-white mt-1.5 font-mono">
                    {formatVND(
                      (selectedDb === 'sqlite' || selectedDb === 'supabase' || selectedDb === 'neon' ? 0 : 350000) +
                      (selectedHost === 'vps' ? 120000 : 0) +
                      (selectedPython === 'cloud_run' ? 180000 : 0) +
                      (selectedAi === 'gemini_free' ? 0 : selectedAi === 'gemini_pay' ? 50000 : 200000) +
                      (selectedNotify === 'twilio' ? 150000 : 0)
                    )}
                    <span className="text-xs text-slate-400 font-semibold block mt-0.5">/ mỗi tháng</span>
                  </p>
                </div>

                {((selectedDb === 'sqlite' || selectedDb === 'supabase' || selectedDb === 'neon') &&
                  selectedHost !== 'vps' &&
                  selectedPython !== 'cloud_run' &&
                  selectedAi === 'gemini_free' &&
                  selectedNotify !== 'twilio') ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">⭐ CẤU HÌNH 0 ĐỒNG CHIẾN THẦN!</span>
                    <p className="text-[11px] text-slate-300 font-semibold leading-relaxed">
                      Bạn đã tối ưu hạ tầng về <strong>0đ</strong> tuyệt đối! Với stack này, bạn có thể phục vụ từ trơn tru 5-20 doanh nghiệp SME kiểm toán dọn data mà không mất phí duy trì máy chủ.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      Bạn đang sử dụng một vài tùy chọn trả phí để có cấu hình chịu tải cấp cao cho đại doanh nghiệp. Bạn hoàn toàn có thể chọn các mác 0đ bên trái để ép chi phí vận hành về không!
                    </p>
                  </div>
                )}

                <div className="border-t border-slate-900 pt-3 space-y-2 text-[11px] text-slate-350 text-left font-medium">
                  <span className="font-bold text-slate-200 block">Sức mạnh của Hạ tầng Tối ưu:</span>
                  <div className="flex gap-2 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Supabase & Neon</strong> cấp 500MB miễn phí, dư sức lưu trữ hàng trăm nghìn dòng Star schema giao dịch của 1 SME trong nhiều năm.</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Google Gemini Studio API</strong> miễn phí vượt chuẩn: Tốc độ xử lý cực khủng, bóc hóa đơn chuẩn hơn OCR cổ điển vạn lần.</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Telegram Alerts</strong> nhận thông báo biến động tức thì từ webhook của Vercel hoàn toàn miễn phí, mượt mà.</span>
                  </div>
                </div>
              </div>

              {/* Absolute secret tips card for Solo Founders */}
              <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Mẹo Giữ Lớp Operational Cost = 0đ khi Scale
                </h4>
                <ul className="space-y-2 text-xs text-slate-400 font-medium">
                  <li>
                    <strong className="text-slate-200">1. Đóng băng các dự án rảnh:</strong> Supabase/Neon sẽ tự ngủ đông nếu không hoạt động 1 tuần. Hãy tạo một Cron job bằng Github Actions (cũng 100% free) ping kiểm tra cơ sở dữ liệu rùa bò định kỳ để giữ máy chủ thức giấc!
                  </li>
                  <li>
                    <strong className="text-slate-200">2. Cache kết quả AI thô:</strong> Lưu các chuỗi hóa đơn đã phân tách từ cột API của Gemini thô vào bảng hạch toán ngay, tránh gửi lại cùng một ảnh hóa đơn nhiều lần để không rủi ro cạn hạn ngạch free 1500 request/ngày.
                  </li>
                  <li>
                    <strong className="text-slate-200">3. Sử dụng Google Colab / Streamlit:</strong> Để phân tích Excel, hãy hướng dẫn khách hàng upload trực tiếp lên Streamlit Cloud của bạn. Máy chủ Streamlit miễn phí xử lý RAM đến 1GB tha hồ tính toán file lớn.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. COURSE PROGRESS TRACKER SECTION */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-tr from-slate-950/40 via-slate-900/40 to-slate-950/20 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl"></div>
            
            <div className="grid lg:grid-cols-12 gap-6 items-center">
              {/* Introduction & Checker list */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <span className="text-[10px] font-black text-indigo-405 uppercase font-mono block tracking-widest">MASTER SYSTEM PLATFORM</span>
                  <h2 className="text-sm font-black uppercase text-slate-100 mt-1 flex items-center gap-1.5 font-sans">
                    🎯 Bản Đồ & Trình Đánh Giá Năng Lực AI-Solo Founder
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                    Đánh dấu các học phần bạn đã rèn luyện thành thục qua 8 đề mục lớn của LedgerFlow Studio để vẽ biểu đồ mạng nhện kỹ năng trực quan hóa ngay bên cạnh:
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { id: 'mod_1_ideas', label: '1A. Ý tưởng Solo Business', desc: 'Phân tích 10 ý tưởng khởi nghiệp ngách thu MRR đơn giản', color: 'border-purple-500/20' },
                    { id: 'mod_2_financials', label: '1B. Tài chính & Pháp lý', desc: 'Cân đối dòng tiền, bẻ CAC & Pháp lý/Thuế hộ kinh doanh', color: 'border-purple-500/20' },
                    { id: 'mod_3_roadmap', label: '2. Tuần tự A-Z Web Roadmap', desc: '12 tuần lập trình Flask, SQLite, hạch toán, JWT & Deploy Render/0đ', color: 'border-purple-500/20' },
                    { id: 'mod_4_datascience', label: '3. Đa ngành Data Science & FinLab', desc: 'Xử lý hóa đơn ETL, Schema sao SQL & định giá CAPM/NPV', color: 'border-emerald-500/20' },
                    { id: 'mod_5_prompts', label: '4. Bộ Kỹ Sư Prompt Chuyên Sâu', desc: 'Làm chủ nghệ thuật viết prompt bóc tách XML/PDF mộc cực lẹ', color: 'border-emerald-500/20' },
                    { id: 'mod_6_gemini', label: '5. Trợ Lý AI Gemini Chatbot', desc: 'Tích hợp API Gemini bóc hóa đơn trực tiếp trên Frontend/Backend', color: 'border-indigo-500/20' },
                    { id: 'mod_7_sandbox', label: '6. Không Gian Dữ Liệu Tự Do', desc: 'Chuẩn hóa định dạng CSV/JSON & Truy vấn SQLite Sandbox rảnh tay', color: 'border-indigo-500/20' },
                    { id: 'mod_8_ecosystem', label: '7. Sơ đồ AI & Quy trình thực hiện', desc: 'Bản mẫu kiến trúc dòng chảy AI Agent hạch toán chuẩn Thông tư 200/133', color: 'border-indigo-500/20' },
                    { id: 'mod_9_game_ml', label: '8. Game Mobile & ML Labs', desc: 'Cơ chế Idle game realistic, lượng tử hóa INT8 & CNN/Transformer', color: 'border-sky-500/20' },
                  ].map(mod => {
                    const isDone = completedModules[mod.id];
                    return (
                      <button
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 w-full group ${
                          isDone 
                            ? 'bg-indigo-500/10 border-indigo-500/40' 
                            : 'bg-slate-950/80 border-slate-900 hover:border-slate-800'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border mt-0.5 transition-all ${
                          isDone
                            ? 'bg-indigo-500 border-indigo-400 text-white'
                            : 'bg-[#040810] border-slate-800 text-transparent group-hover:border-slate-700'
                        }`}>
                          <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                        </div>
                        <div>
                          <span className={`text-[11.5px] font-extrabold block leading-none ${
                            isDone ? 'text-indigo-300' : 'text-slate-300'
                          }`}>
                            {mod.label}
                          </span>
                          <span className="text-[9.5px] text-slate-500 block mt-1 font-medium leading-tight">
                            {mod.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Radar visualization & Advice (5 cols) */}
              <div className="lg:col-span-5 bg-slate-950/70 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider text-center flex items-center gap-1.5 justify-center font-mono">
                    <BrainCircuit className="w-4 h-4 text-indigo-400 animate-pulse" />
                    Biểu Đồ Mạng Nhện Năng Lực AI-Solo
                  </h3>
                  
                  {/* Recharts chart */}
                  <div className="h-[210px] w-full flex items-center justify-center mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData()}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 8 }} />
                        <Radar 
                          name="Kỹ năng tự học" 
                          dataKey="A" 
                          stroke="#6366f1" 
                          fill="#6366f1" 
                          fillOpacity={0.25} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#030712', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Customized Advice box */}
                <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400 font-mono block">
                    Lời khuyên kiến tạo sự nghiệp thích nghi:
                  </span>
                  
                  {Object.values(completedModules).filter(Boolean).length === 9 ? (
                    <p className="text-[10.5px] text-slate-300 leading-relaxed font-semibold">
                      🎉 <strong>Bậc Thầy Thực Chiến Tuyệt Đối!</strong> Bạn đã nắm vững toàn bộ stack tài chính, dữ liệu cực lớn, hạch toán hóa đơn XML, Docker 0đ cho tới phát triển Game di động và Mô hình ML. Bạn đã cực kỳ sẵn sàng tự tin đi Pitch cho 5-20 Client SMEs trong nước!
                    </p>
                  ) : Object.values(completedModules).filter(Boolean).length >= 5 ? (
                    <p className="text-[10.5px] text-slate-300 leading-relaxed font-semibold">
                      🚀 <strong>Đà Tiến Trình Đầy Triển Vọng!</strong> Bạn đã làm chủ cơ sở ý tưởng, bóc hóa đơn và viết prompt chuẩn AI. Hãy tiếp tục nghiên cứu sâu thêm phần 8, 9 (Deploy Docker 0đ & Game mobile/Machine learning) để toàn diện hóa năng lực fullstack của mình.
                    </p>
                  ) : (
                    <p className="text-[10.5px] text-slate-350 leading-relaxed font-semibold">
                      🎒 <strong>Khởi Đầu Vững Chắc!</strong> Hãy tích lũy ít nhất 5/9 kỹ năng rực rỡ ở danh sách bên trái. Hãy click chọn từng tác vụ sau khi đọc để mài sắc công lực dọn dẹp số liệu, tăng tốc quy trình hạch toán dòng tiền hiệu cơ nhất.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
