import React, { useState, useEffect } from 'react';
import { SECTORS_DATA } from '../data/sectors';
import { SectorMetric } from '../types';
import { 
  Database, 
  AlertTriangle, 
  TrendingUp, 
  Copy, 
  Terminal, 
  Library, 
  CheckCircle2, 
  ChevronRight, 
  Minimize2, 
  Cpu, 
  Play, 
  RefreshCw, 
  Sliders, 
  Layers, 
  LineChart, 
  AlertOctagon, 
  UserCheck, 
  CheckCheck,
  BookOpen,
  Percent,
  Scale,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  BarChart, Bar, Legend, ReferenceLine, LineChart as RechartsLineChart, Line
} from 'recharts';
import FinancialDataScienceLab from './FinancialDataScienceLab';

export default function DataScienceEngineering() {
  const [selectedSec, setSelectedSec] = useState<string>(SECTORS_DATA[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulation States
  const [sampleSize, setSampleSize] = useState<number>(350);
  const [sliderParam, setSliderParam] = useState<number>(50); // General parameter 0-100 mapped according to sector
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [simResults, setSimResults] = useState<any>(null);

  // Tab mode & Financial Data Science Lab States
  const [viewMode, setViewMode] = useState<'sectors' | 'finds'>('sectors');
  const [findsSubTab, setFindsSubTab] = useState<'ltv_cac' | 'capm_beta' | 'monte_carlo'>('ltv_cac');

  // LTV/CAC Churn States
  const [arpu, setArpu] = useState<number>(450000); // 450,000 VND / month
  const [churn, setChurn] = useState<number>(5.5); // 5.5% month over month
  const [cac, setCac] = useState<number>(1200000); // 1,200,000 VND acqusition cost

  // CAPM Beta States
  const [riskFreeRate, setRiskFreeRate] = useState<number>(4.8); // 4.8% govt bond
  const [marketRate, setMarketRate] = useState<number>(12.2); // 12.2% VN-Index average
  const [betaValue, setBetaValue] = useState<number>(1.25); // system volatility multiplier

  // Monte Carlo NPV States
  const [mcInvestment, setMcInvestment] = useState<number>(350); // 350 Million VND
  const [mcCashFlow, setMcCashFlow] = useState<number>(110); // 110 Million VND expected per year
  const [mcVolatility, setMcVolatility] = useState<number>(22); // 22% SD
  const [mcDiscount, setMcDiscount] = useState<number>(10.5); // 10.5% WACC
  const [mcYears, setMcYears] = useState<number>(5); // 5 years horizon

  const activeSecData = SECTORS_DATA.find(s => s.id === selectedSec) || SECTORS_DATA[0];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error('Lỗi sao chép: ', err);
    });
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return { border: 'border-blue-500/20', bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'shadow-blue-500/10' };
      case 'green': return { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/10' };
      case 'purple': return { border: 'border-purple-500/20', bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'shadow-purple-500/10' };
      case 'amber': return { border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-400', glow: 'shadow-amber-500/10' };
      case 'cyan': return { border: 'border-cyan-500/20', bg: 'bg-cyan-500/10', text: 'text-cyan-400', glow: 'shadow-cyan-500/10' };
      case 'red': return { border: 'border-rose-500/20', bg: 'bg-rose-500/10', text: 'text-rose-400', glow: 'shadow-rose-500/10' };
      default: return { border: 'border-slate-800', bg: 'bg-slate-900', text: 'text-slate-400', glow: '' };
    }
  };

  const schemeColors = getColorClasses(activeSecData.color);

  // Trigger default simulation statistics on sector change
  useEffect(() => {
    runAutoQuickSimulation();
  }, [selectedSec]);

  const runAutoQuickSimulation = () => {
    // Immediate calculation without full stdout animation delay for smooth selection transition
    generateSimulationData(sampleSize, sliderParam);
  };

  const handleManualPipeline = () => {
    setSimulating(true);
    setSimStep(1);
    setConsoleLogs([]);
    
    const steps = [
      `[Pandas-Loader] Đang mở luồng tải tệp dữ liệu giao dịch phụ trợ (${sampleSize} hàng)...`,
      `[Data-Cleaning] Phát hiện và chuẩn hoá chữ viết tiếng Việt có dấu, định dạng tiền tệ...`,
      `[Audit-Engine] Đang khởi chạy hệ quy chiếu kiểm tra rủi ro ngành '${activeSecData.name.split(' (')[0]}' với tham số lọc ${sliderParam}%...`,
      `[ML-Model] Đang thực thi tổng hợp dòng dữ cứu, trích xuất KPI toán hạng và vẽ biểu đồ dự phóng...`,
      `[Pipeline-Success] Pipeline dữ liệu đã thống kê thành công và kiểm định hội tụ chuẩn!`
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setConsoleLogs(prev => [...prev, steps[current]]);
        setSimStep(current + 2);
        current++;
      } else {
        clearInterval(interval);
        setSimulating(false);
        generateSimulationData(sampleSize, sliderParam);
      }
    }, 380);
  };

  // Business formula simulations to populate high-fidelity dashboards based on Vietnamese legal rules
  const generateSimulationData = (size: number, param: number) => {
    const results: any = {
      totalRecords: size,
      lastUpdated: new Date().toLocaleTimeString(),
    };

    switch (selectedSec) {
      case 'accounting': {
        // Param controls targeted tax/invoice check strictness
        // Simulated VAT errors detected (usually 1.5% to 8% depending on parameters)
        const errorRate = Math.max(1.2, (100 - param) / 10); 
        const anomalousInvoicesCount = Math.round((size * errorRate) / 100);
        const totalVatCalculated = size * 2650000;
        const potentialTaxRisk = anomalousInvoicesCount * 8600000;

        results.metrics = [
          { label: 'Tổng số hoá đơn', value: `${size} bản ghi` },
          { label: 'Hóa đơn vướng thuế suất', value: `${anomalousInvoicesCount} hoá đơn`, alert: anomalousInvoicesCount > 4 },
          { label: 'Doanh thu VAT tạm duyệt', value: `${(totalVatCalculated / 1000000).toFixed(1)} triệu VND` },
          { label: 'Rủi ro tạm thời do sai VAT', value: `${(potentialTaxRisk / 1000000).toFixed(1)} triệu VND`, borderRose: true }
        ];

        // Items for visual table
        results.sampleData = [
          { code: 'HD-E02-58', content: 'Xe nâng xúc xúc đất công trường', amount: 350000000, vatRate: '9%', status: 'Nghi ngờ (Sai quy định 8% hoặc 10%)' },
          { code: 'HD-I91-12', content: 'Chi lương nhân viên hành chính kế toán', amount: 45000000, vatRate: 'KK', status: 'Cần phân bổ thủ công' },
          { code: 'HD-U88-21', content: 'Mua văn phòng phẩm khối nghiệp vụ', amount: 8200000, vatRate: '5.5%', status: 'Vắt sổ lỗi lẻ thương mại' },
        ];
        break;
      }
      case 'auditing': {
        // Param is threshold in Million VND of transactions being flagged if too rounded or weekend anomalous
        const weekendCount = Math.round(size * 0.18 + (param / 5)); // weekend simulated count
        const roundedMillionsCount = Math.round(size * 0.05 + ((100 - param) / 10)); // e.g. 10.000.000 vnd
        const finalAuditTraceCount = weekendCount + roundedMillionsCount;

        results.metrics = [
          { label: 'Nhật trình thao tác', value: `${size} bản ghi` },
          { label: 'Phát hiện rủi ro cao', value: `${finalAuditTraceCount} bút toán`, alert: finalAuditTraceCount > 15 },
          { label: 'Giao dịch ngoài giờ hành chính', value: `${weekendCount} phiếu chi` },
          { label: 'Tỷ lệ báo động an toàn', value: `${((finalAuditTraceCount / size) * 100).toFixed(1)}%` }
        ];

        results.sampleData = [
          { code: 'AUD-3011', content: 'Nộp tiền quỹ mặt ngoài giờ hành chính (23:45)', amount: 50000000, type: 'CRITICAL', status: 'Ghi chép sửa lùi ngày Hệ thống' },
          { code: 'AUD-9204', content: 'Thanh lý sấy phế liệu nhà máy thép tròn', amount: 20000000, type: 'WARNING', status: 'Bút toán không kèm hóa đơn gốc' },
          { code: 'AUD-1823', content: 'Xuất chi tiền mặt tiếp khách hàng', amount: 15400000, type: 'STABLE', status: 'Lịch sử log bị sửa bởi Admin' },
        ];
        break;
      }
      case 'finance': {
        // Param controls Revenue growth forecast % (e.g. up to 45%)
        const monthlyRevenueBasis = 85000000; // 85M VND basic
        const pctGrowth = (param / 2); // growth up to 50%
        const finalProjectedRev = monthlyRevenueBasis * (1 + pctGrowth / 100);
        const profitMargin = 0.85; // SaaS margins or consultant margins
        const burnRate = 18000000; // 18M VND cost operation

        results.metrics = [
          { label: 'Ước lượng MRR kế hoạch', value: `${(finalProjectedRev / 1000000).toFixed(1)} triệu VND` },
          { label: 'Lợi nhuận gộp danh định', value: `${((finalProjectedRev * profitMargin) / 1000000).toFixed(1)} triệu VND` },
          { label: 'Quỹ vận hành an toàn', value: `${burnRate / 1000000} triệu VND / tháng` },
          { label: 'Tháng dự phòng dòng tiền', value: `${((finalProjectedRev * profitMargin - burnRate) > 0 ? 'Hơn 18 tháng' : 'Cần bơm vốn')}` }
        ];

        results.chartValues = Array.from({ length: 6 }, (_, i) => {
          const mult = 1 + (pctGrowth / 100) * (i / 5);
          return Math.round(monthlyRevenueBasis * mult);
        });
        break;
      }
      case 'construction': {
        // Param matches construction deviation buffer %
        const budgetMultiplier = 1 + (param / 400); // variance up to 25%
        const siteAActual = Math.round(450000000 * budgetMultiplier);
        const siteBActual = Math.round(1200000000 * (1.05 + (param / 600)));

        results.metrics = [
          { label: 'Số dự án công trình', value: '3 điểm thi công' },
          { label: 'Vượt định mức cát đá', value: `Vượt ${(param / 10).toFixed(1)}%` },
          { label: 'Thực chi tổng kiểm kê', value: `${((siteAActual + siteBActual) / 1000000000).toFixed(2)} tỷ VND` },
          { label: 'Trạng thái giải ngân', value: param < 40 ? 'An toàn (Trong dự toán)' : 'Báo động (Vượt kiểm soát)', alert: param >= 40 }
        ];

        results.chartValues = [
          { name: 'Công trình Cầu Giấy', budget: 450000000, actual: siteAActual },
          { name: 'Khách sạn Đà Nẵng', budget: 1200000000, actual: siteBActual },
          { name: 'Khu công nghiệp Hải Phòng', budget: 3500000000, actual: Math.round(3500000000 * 0.98) }
        ];
        break;
      }
      case 'trade': {
        // Param is RFM threshold for loyalty categorization
        const rfmVIPLimit = 15000000 + (param * 200000); // 15M to 35M VND threshold
        const vipCount = Math.max(2, Math.round(size * 0.12 - (param / 12)));
        const atRiskCount = Math.round(size * 0.28 + (param / 20));

        results.metrics = [
          { label: 'Tệp Khách hàng số', value: `${size} tài khoản` },
          { label: 'Khách hàng VIP phân nhóm', value: `${vipCount} thành viên` },
          { label: 'Khách hàng At Risk (Sắp bỏ)', value: `${atRiskCount} người`, alert: atRiskCount > 100 },
          { label: 'Doanh nghiệp CLV bình quân', value: `${(24500000 / 1000000).toFixed(1)} triệu VND` }
        ];

        results.chartValues = [
          { group: 'Active (Ổn định)', qty: Math.round(size * 0.6) },
          { group: 'VIP (Chi tiêu cao)', qty: vipCount },
          { group: 'At Risk (Cần tương tác)', qty: atRiskCount }
        ];
        break;
      }
      case 'service': {
        // Param controls SLA Target response speed minutes (10m - 120m)
        const slaLimit = 15 + Math.round(param); 
        const ticketsBreached = Math.round(size * (Math.max(1, (120 - slaLimit) / 12) / 100));

        results.metrics = [
          { label: 'Tổng Ticket tiếp nhận', value: `${size} phiếu yêu cầu` },
          { label: 'Mục tiêu phản hồi SLA', value: `${slaLimit} phút` },
          { label: 'Ticket trễ hạn KPI', value: `${ticketsBreached} yêu cầu`, alert: ticketsBreached > size * 0.05 },
          { label: 'Sản lượng xử lý / KTV', value: '42 Ticket / tuần' }
        ];

        results.sampleData = [
          { id: 'TKT-991', user: 'Lê Hoài Nam', wait: `${slaLimit + 12} phút`, status: 'Quá SLA (Trễ do thiếu kỹ thuật viên)' },
          { id: 'TKT-821', user: 'Cty TNHH Đại Việt', wait: `${Math.round(slaLimit * 0.4)} phút`, status: 'Đạt SLA' },
          { id: 'TKT-441', user: 'Phạm Minh Toàn', wait: '8 phút', status: 'Đạt SLA (Tốc độ cao)' }
        ];
        break;
      }
      case 'manufacturing': {
        // Param is Optimal Machine run rate RPM
        const optimalRPM = 1200 + param * 10;
        const oeeCalculation = Math.max(50, 95 - (param > 65 ? (param - 65) * 1.2 : (65 - param) * 0.2));
        const defectPartsPct = 0.5 + Math.max(0, (param - 60) * 0.1);

        results.metrics = [
          { label: 'Tần suất dòng máy thi công', value: `${optimalRPM} Vòng/Phút` },
          { label: 'Hiệu suất thiết bị OEE', value: `${oeeCalculation.toFixed(1)}%`, alert: oeeCalculation < 75 },
          { label: 'Tỷ lệ phế phẩm sản xuất', value: `${defectPartsPct.toFixed(2)}%`, borderRose: defectPartsPct > 1.8 },
          { label: 'Lượng sản phẩm xuất xưởng', value: `${Math.round(size * 12.5)} đơn vị/giờ` }
        ];

        results.chartValues = [
          { part: 'Khả dụng (Availability)', score: Math.round(oeeCalculation * 1.01) },
          { part: 'Hiệu suất (Performance)', score: Math.round(oeeCalculation * 0.98) },
          { part: 'Chất lượng (Quality)', score: Math.round(100 - defectPartsPct) }
        ];
        break;
      }
      default:
        break;
    }

    setSimResults(results);
  };

  const getSldLabel = () => {
    switch (selectedSec) {
      case 'accounting': return 'Độ nhạy phát hiện sai lệch hoá đơn';
      case 'auditing': return 'Bộ lọc ngưỡng giá trị đáng nghi ( triệu VND)';
      case 'finance': return 'Độ dốc tăng trưởng doanh thu dự báo (%)';
      case 'construction': return 'Độ lệch tiêu hao vật tư biên thi công';
      case 'trade': return 'Ngưỡng chi tiêu trần xếp hạng VIP';
      case 'service': return 'Thời gian giới hạn tiêu chuẩn SLA (Phút)';
      case 'manufacturing': return 'Tần suất vận hành động cơ tối ưu (Tải trọng RPM)';
      default: return 'Tham số kiểm thử mô phỏng';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* CHẾ ĐỘ VIEW TỔNG THỂ */}
      <div className="p-4 bg-gradient-to-r from-[#030712] via-[#090d1a] to-[#030712] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              🔬 Lab Khoa Học Dữ Liệu & Kinh Doanh Tài Chính
            </h3>
            <p className="text-[10.5px] text-slate-500 font-semibold leading-none mt-1">
              Phân tách rủi ro 7 ngành nghề trọng tâm hoặc thực hành mô hình tài chính định lượng cao cấp
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setViewMode('sectors')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5 uppercase tracking-wide cursor-pointer ${
              viewMode === 'sectors' 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                : 'text-slate-400 bg-slate-950 border-slate-900 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Phân Tích 7 Ngành Sát Sườn</span>
          </button>
          
          <button
            onClick={() => setViewMode('finds')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5 uppercase tracking-wide cursor-pointer relative ${
              viewMode === 'finds' 
                ? 'bg-indigo-600 border-indigo-505 text-white shadow-lg' 
                : 'text-slate-400 bg-slate-950 border-slate-900 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>FinDS-Lab: Định Lượng</span>
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-rose-600 text-[7px] text-white rounded-full font-extrabold uppercase animate-bounce leading-none border border-rose-500/50">MỚI</span>
          </button>
        </div>
      </div>

      {viewMode === 'sectors' ? (
        <div className="grid lg:grid-cols-4 gap-6">
      {/* SECTORS SELECTED BUTTONS (left/top) */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-3 px-1">Lựa chọn 7 Ngành Công Nghiệp</span>
          <div className="flex flex-col gap-1.5">
            {SECTORS_DATA.map(sec => (
              <button
                key={sec.id}
                onClick={() => setSelectedSec(sec.id)}
                className={`w-full text-left p-2.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-between ${
                  selectedSec === sec.id 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                    : 'bg-slate-950 border-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">{sec.emoji}</span>
                  <span className="truncate">{sec.name.split(' (')[0]}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Unified architectural helper card */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850/80 text-xs text-slate-400 leading-relaxed">
          <div className="flex items-center gap-2 mb-2">
            <Minimize2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-300">Quy tắc Star Schema:</span>
          </div>
          <p className="text-[10.5px]">
            Tất cả mô hình công nghiệp đều được cấu trúc hóa theo dạng hình sao: Một bảng dữ liệu thực tế <strong className="text-slate-200">Fact (Giao dịch)</strong> liên kết với các bảng <strong className="text-slate-200">Dimension (Danh mục)</strong> nhằm chuẩn hóa tối đa truy vấn SQL & tốc độ tính toán Pandas.
          </p>
        </div>
      </div>

      {/* CORE DETAILS COMPONENT INFO (right/center area) */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
            <div className="flex items-center gap-3">
              <span className={`text-2xl p-2 rounded-lg border ${schemeColors.border} ${schemeColors.bg}`}>
                {activeSecData.emoji}
              </span>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">{activeSecData.name}</h3>
                <p className="text-slate-400 text-xs font-semibold">Tự động cấu trúc hóa, chuẩn truy vấn & giả lập pipelines thực thi</p>
              </div>
            </div>
            <span className={`text-[9px] uppercase font-extrabold tracking-widest px-3 py-1 rounded-full border ${schemeColors.border} ${schemeColors.bg} ${schemeColors.text}`}>
              Sẵn sàng phân tích
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* KPI MEASURES LIST */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-5 text-emerald-400 shrink-0" />
                Chỉ số KPI Quản Trị cốt lõi (Metrics):
              </h4>
              <div className="grid gap-2">
                {activeSecData.kpis.map((kpi, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-850/80 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-slate-200 font-semibold">{kpi}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RISKS & AUDIT RULES */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-5 text-rose-400 shrink-0" />
                Cảnh báo rủi ro & sai phạm (Risk Checks):
              </h4>
              <div className="grid gap-2">
                {activeSecData.risks.map((risk, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-850/80 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 shrink-0 text-xs flex items-center justify-center font-bold font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-slate-400 leading-relaxed font-medium">{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE ENGINEERING REPRESENTATIONS (FACT VS DIM) */}
          <div className="space-y-4 pt-4 border-t border-slate-850">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-5 text-purple-400 shrink-0" />
              Sơ đồ kho dữ liệu Chuẩn Star Schema (Fact vs Dim Tables):
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              {activeSecData.dataTables.map((table, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-850/80">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-200">Table: {table.name}</span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                      idx === 0 
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                        : 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                    }`}>
                      {idx === 0 ? 'Giao dịch chính (Fact)' : 'Danh mục mô tả (Dimension)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed font-medium">{table.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {table.columns.map(col => (
                      <span key={col} className="text-[10px] font-mono font-medium px-2.5 py-1 bg-slate-900 border border-slate-850 rounded text-slate-400">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INTERACTIVE PANDAS SIMULATION SANDBOX (NEW ADDED ADVANCED FEATURE) */}
          <div className="pt-5 border-t border-slate-850 space-y-4">
            <div className="flex items-center gap-2.5 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
              <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  Hộp cát Giả Lập Pandas & Analytics Pipeline Thực Chiến
                  <span className="bg-blue-500/10 text-blue-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-blue-500/20">NEW</span>
                </h4>
                <p className="text-slate-500 text-[11px] font-medium">Bấm chạy giả lập dữ liệu lớn, tinh chỉnh tham số toán hạng để xem KPIs và biểu đồ trực quan nhảy ngay lập tức.</p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl border border-slate-850 p-5 grid md:grid-cols-12 gap-6">
              {/* Sliders Control Side (4 cols) */}
              <div className="md:col-span-4 space-y-4 border-r border-slate-850/60 md:pr-6">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  Biến số Mô phỏng
                </h5>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Quy mô mẫu dữ liệu (Rows):</span>
                    <strong className="text-white font-mono">{sampleSize} records</strong>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="50"
                    value={sampleSize}
                    onChange={(e) => {
                      setSampleSize(Number(e.target.value));
                      generateSimulationData(Number(e.target.value), sliderParam);
                    }}
                    disabled={simulating}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">{getSldLabel()}</span>
                    <strong className="text-white font-mono">{sliderParam}%</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={sliderParam}
                    onChange={(e) => {
                      setSliderParam(Number(e.target.value));
                      generateSimulationData(sampleSize, Number(e.target.value));
                    }}
                    disabled={simulating}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <button
                  onClick={handleManualPipeline}
                  disabled={simulating}
                  className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  <span>{simulating ? 'Đang Biên Dịch...' : 'Chạy Pipeline Giả Lập'}</span>
                </button>
              </div>

              {/* Console & Dynamic Result Side (8 cols) */}
              <div className="md:col-span-8 flex flex-col justify-between space-y-4">
                {/* Console trace or actual Visual Result */}
                {simulating ? (
                  <div className="bg-[#02050a] p-4 rounded-lg border border-slate-850 font-mono text-[10.5px] leading-relaxed text-slate-400 space-y-1.5 h-44 overflow-y-auto">
                    <div className="flex items-center gap-1.5 text-blue-400 border-b border-slate-900 pb-1.5 mb-1.5">
                      <Terminal className="w-3.5 h-3.5 animate-pulse" />
                      <span>Python Executive Environment (v3.10.2)</span>
                    </div>
                    {consoleLogs.map((log, idx) => (
                      <p key={idx} className="animate-fade-in">{log}</p>
                    ))}
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-600 pt-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Pandas DataFrames allocating local memory...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Visual output blocks when simulation complete */}
                    {simResults && (
                      <div className="space-y-4">
                        {/* Simulation Metrics Dashboard Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {simResults.metrics?.map((m: any, idx: number) => (
                            <div key={idx} className="bg-slate-900/80 border border-slate-850 p-2.5 rounded-lg">
                              <span className="text-[9px] text-slate-500 font-extrabold uppercase block tracking-wider truncate">{m.label}</span>
                              <strong className={`text-xs block mt-1 tracking-tight font-mono ${
                                m.alert ? 'text-rose-400' : m.borderRose ? 'text-amber-400' : 'text-slate-100'
                              }`}>
                                {m.value}
                              </strong>
                            </div>
                          ))}
                        </div>

                        {/* HIGH VISIBILITY CHART INJECTIONS */}
                        <div className="p-3 bg-[#02050b] rounded-lg border border-slate-850/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                              <LineChart className="w-3.5 h-3.5 text-blue-400" />
                              Trực quan hoá kết quả xử lý dữ liệu
                            </span>
                            <span className="text-[9px] text-slate-600 font-mono">Dữ liệu phân tích lúc {simResults.lastUpdated}</span>
                          </div>

                          {/* RENDERING DYNAMIC SVG CHARTS ACCORDING TO CURRENT SECTOR */}
                          {selectedSec === 'accounting' && (
                            <div className="grid grid-cols-12 gap-3 items-center pt-2">
                              {/* Left Text */}
                              <div className="col-span-5 text-left text-[11px] text-slate-400 space-y-1">
                                <p className="font-semibold text-slate-300">Đầu ra mô hình Kế toán:</p>
                                <p>Phân bổ chi phí VAT bị lệch thuế suất chuẩn Việt Nam được tự động quét sạch bằng thư viện <strong className="text-slate-300 font-mono">re</strong> & pandas.</p>
                              </div>
                              {/* Right Inline Visual charts */}
                              <div className="col-span-7 bg-slate-900/40 p-2.5 rounded border border-slate-850 space-y-2">
                                <div className="space-y-1 text-[10px]">
                                  <div className="flex justify-between font-mono text-slate-500">
                                    <span>Hoá đơn lệch (Red)</span>
                                    <span>{simResults.metrics[1].value}</span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-rose-500 h-full transition-all duration-500" 
                                      style={{ width: `${Math.min(100, (parseInt(simResults.metrics[1].value) / sampleSize) * 400)}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="space-y-1 text-[10px]">
                                  <div className="flex justify-between font-mono text-slate-500">
                                    <span>Hoá đơn hợp lệ (Green)</span>
                                    <span>{sampleSize - parseInt(simResults.metrics[1].value)} bản ghi</span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full" style={{ width: '92%' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedSec === 'auditing' && (
                            <div className="space-y-2 pt-1 text-[11px]">
                              <p className="font-semibold text-slate-300 flex items-center gap-1">
                                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                                Bản đồ phân nhóm tần suất bút toán rủi ro:
                              </p>
                              <div className="flex justify-around items-end h-16 pt-2 bg-slate-900/30 rounded border border-slate-850">
                                <div className="flex flex-col items-center w-1/4 gap-1">
                                  <div className="bg-emerald-500/20 border border-emerald-500/30 w-6 rounded-t transition-all duration-300" style={{ height: '35%' }}></div>
                                  <span className="text-[9px] text-slate-500">Normal logs</span>
                                </div>
                                <div className="flex flex-col items-center w-1/4 gap-1">
                                  <div className="bg-amber-500/30 border border-amber-500/40 w-6 rounded-t transition-all duration-300" style={{ height: '55%' }}></div>
                                  <span className="text-[9px] text-slate-500">Weekend logs</span>
                                </div>
                                <div className="flex flex-col items-center w-1/4 gap-1">
                                  <div className="bg-rose-500/30 border border-rose-500/40 w-6 rounded-t transition-all duration-300 active-bar" style={{ height: `${Math.min(100, Math.max(10, (100 - sliderParam) * 1.2))}%` }}></div>
                                  <span className="text-[9px] text-rose-500 font-bold">Risk peaks</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedSec === 'finance' && (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[11px] font-semibold text-slate-300 mb-1">Dự báo Dòng tiền Kế toán 6 tháng tới (VND):</p>
                              {/* High-fidelity responsive inline chart mockup lines */}
                              <div className="flex items-end justify-between h-16 pt-3 px-4 bg-slate-900/40 rounded border border-slate-850">
                                {simResults.chartValues?.map((val: number, i: number) => {
                                  const heightPercent = Math.min(100, Math.max(20, (val / 160000000) * 100));
                                  return (
                                    <div key={i} className="flex flex-col items-center flex-1 group">
                                      <div className="text-[8px] text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">{(val / 1000000).toFixed(0)}M</div>
                                      <div 
                                        className="bg-blue-500 hover:bg-blue-400 w-3 rounded-t transition-all duration-500 cursor-pointer" 
                                        style={{ height: `${heightPercent}%` }}
                                      ></div>
                                      <span className="text-[8px] text-slate-600 font-mono mt-1">T{i + 1}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {selectedSec === 'construction' && (
                            <div className="space-y-2 pt-1 text-[11px]">
                              <p className="font-semibold text-slate-300">Biểu đồ đối chiếu Ngân sách Thực tế các công trường thi công:</p>
                              <div className="space-y-1.5">
                                {simResults.chartValues?.map((site: any, idx: number) => {
                                  const budgetPercent = 100;
                                  const actualPercent = Math.min(130, (site.actual / site.budget) * 100);
                                  const overBudget = site.actual > site.budget;
                                  return (
                                    <div key={idx} className="space-y-1 bg-slate-900/30 p-2 rounded">
                                      <div className="flex justify-between text-[10px]">
                                        <span className="font-bold text-slate-300">{site.name}</span>
                                        <span className={overBudget ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                                          {(site.actual / 1000000).toFixed(0)}M / {(site.budget / 1000000).toFixed(0)}M VND
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
                                        <div className="bg-slate-700 h-full absolute inset-0 rounded-full" style={{ width: '80%' }}></div>
                                        <div 
                                          className={`h-full absolute left-0 top-0 transition-all duration-500 ${overBudget ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                          style={{ width: `${Math.min(100, actualPercent * 0.8)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {selectedSec === 'trade' && (
                            <div className="space-y-2 pt-1 text-[11px]">
                              <span className="font-semibold text-slate-300">Phân luồng cơ khối Khách hàng dựa theo RFM Scoring:</span>
                              <div className="grid grid-cols-3 gap-2.5">
                                {simResults.chartValues?.map((item: any, idx: number) => (
                                  <div key={idx} className="bg-slate-900/50 p-2 rounded border border-slate-850 text-center">
                                    <span className="text-[10px] text-slate-500 font-bold block">{item.group}</span>
                                    <span className="text-md font-black text-blue-400 block mt-1 font-mono">{item.qty}</span>
                                    <span className="text-[8.5px] text-slate-600 block">khách hàng</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedSec === 'service' && (
                            <div className="space-y-2 pt-1 text-[11px]">
                              <span className="font-semibold text-slate-300">Đánh giá Thời gian phản hồi SLA bình quân:</span>
                              <div className="bg-slate-900/40 p-2 rounded border border-slate-850 flex items-center justify-between text-[10px]">
                                <div className="space-y-1">
                                  <span className="text-slate-500">Mục tiêu quy định tối đa:</span>
                                  <strong className="text-white block font-mono">{sliderParam + 15} phút</strong>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-slate-500">Số Ticket trễ cam kết:</span>
                                  <strong className="text-rose-400 block font-mono">{simResults.metrics[2].value}</strong>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-slate-500">Tỷ lệ SLA đạt chất lượng:</span>
                                  <strong className="text-emerald-400 block font-mono">
                                    {(100 - (parseInt(simResults.metrics[2].value) / sampleSize) * 100).toFixed(1)}%
                                  </strong>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedSec === 'manufacturing' && (
                            <div className="space-y-2 pt-1 text-[11px]">
                              <span className="font-semibold text-slate-300">Biểu đồ Trọng số Hiệu suất thiết bị tổng thể OEE (%):</span>
                              <div className="flex gap-2">
                                {simResults.chartValues?.map((item: any, idx: number) => (
                                  <div key={idx} className="flex-1 bg-slate-900/40 p-2 rounded border border-slate-850">
                                    <div className="flex justify-between text-[9px] text-slate-500">
                                      <span className="truncate">{item.part.split(' (')[0]}</span>
                                      <span className="font-mono text-white">{item.score}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                      <div className="bg-rose-500 h-full" style={{ width: `${item.score}%` }}></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive Data Sample Table Preview */}
                        {simResults.sampleData && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                              Mẫu bản ghi phát hiện lỗi (Trích lục từ DataFrame)
                            </span>
                            <div className="overflow-x-auto rounded border border-slate-850">
                              <table className="w-full text-[10px] font-mono text-slate-400">
                                <thead className="bg-slate-900/80 border-b border-slate-850 text-[9px] text-slate-500 uppercase font-black">
                                  <tr>
                                    <th className="px-3 py-1.5 text-left">Code ID</th>
                                    <th className="px-3 py-1.5 text-left">Nội dung / Mô tả</th>
                                    <th className="px-3 py-1.5 text-right">Trị giá VND / Thuế</th>
                                    <th className="px-3 py-1.5 text-left">Kết luận hệ thống</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900 bg-slate-950/40 font-semibold">
                                  {simResults.sampleData.map((row: any, i: number) => (
                                    <tr key={i}>
                                      <td className="px-3 py-1.5 text-slate-300">{row.code || row.id}</td>
                                      <td className="px-3 py-1.5 text-slate-200 truncate max-w-[150px]">{row.content || row.user}</td>
                                      <td className="px-3 py-1.5 text-right font-bold text-emerald-400">
                                        {row.amount ? `${(row.amount / 1000000).toFixed(1)}M` : row.wait || row.vatRate}
                                      </td>
                                      <td className="px-3 py-1.5 text-slate-400 italic text-[9.5px] truncate max-w-[150px]">{row.status}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PYTHON DATA SCIENCE PLAYGROUND SCRIPT */}
          <div className="space-y-4 pt-4 border-t border-slate-850">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Library className="w-4 h-5 text-blue-500 shrink-0" />
                Mã nguồn pandas & Data phân tích của Chuyên gia:
              </h4>
              <button
                onClick={() => copyToClipboard(activeSecData.pandasSnippet, 'pandas')}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-850 rounded-lg text-slate-400 hover:text-white hover:border-blue-500/40 transition-all text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedId === 'pandas' ? 'Đã sao chép' : 'Sao chép đoạn code'}
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-slate-850 bg-slate-950">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-850">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">analysis_script.py (Google Colab / Local)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <pre className="p-4 overflow-x-auto text-[11.5px] font-mono text-slate-300 leading-relaxed font-semibold">
                {activeSecData.pandasSnippet}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
    ) : (
      <FinancialDataScienceLab />
    )}
    </div>
  );
}
