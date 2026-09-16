import React, { useEffect, useState } from 'react';
import {
  Radar,
  ShieldAlert,
  Swords,
  Target,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Zap,
  DollarSign,
  Award,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface CompetitorProfile {
  competitorId: string;
  name: string;
  targetMarket: string;
  startingPriceVndMonth: number;
  weaknesses: string[];
  strengths: string[];
  ourUspAdvantage: string;
  lastScannedAt: string;
}

export interface BattleCard {
  cardId: string;
  competitorName: string;
  pricingComparison: string;
  killerFeatureComparison: string;
  objectionHandlingScripts: Array<{ clientQuestion: string; winningResponse: string }>;
  suggestedDiscountStrategy: string;
}

const DEFAULT_COMPETITORS: CompetitorProfile[] = [
  {
    competitorId: 'comp_misa_sme',
    name: 'MISA SME / AMIS',
    targetMarket: 'Doanh nghiệp vừa và nhỏ Việt Nam',
    startingPriceVndMonth: 450000,
    weaknesses: ['Chi phí bản quyền và bảo trì đắt đỏ theo user', 'Giao diện truyền thống, thiếu AI tự động hóa', 'Không có tính năng sinh video marketing hay game asset'],
    strengths: ['Thương hiệu lâu đời, quen thuộc với kế toán trưởng truyền thống'],
    ourUspAdvantage: 'Hệ điều hành tự trị tất cả trong một: Kế toán VAS 200 + AI Studio + Video Marketing chỉ với chi phí bằng 1/5.',
    lastScannedAt: new Date().toISOString(),
  },
  {
    competitorId: 'comp_fast_accounting',
    name: 'Fast Accounting Online',
    targetMarket: 'Doanh nghiệp thương mại, dịch vụ, xây dựng',
    startingPriceVndMonth: 350000,
    weaknesses: ['Tính năng AI sơ khai, chỉ có rule tĩnh', 'Cần nhiều thao tác nhập liệu chứng từ thủ công', 'Không hỗ trợ đa nền tảng PC/Mobile mượt mà'],
    strengths: ['Báo cáo tài chính chuẩn mực, mẫu biểu thuế đầy đủ'],
    ourUspAdvantage: 'Tự động hóa gạch nợ VietQR thời gian thực, trợ lý giọng nói CEO và 25 nhân viên AI làm việc 24/7.',
    lastScannedAt: new Date().toISOString(),
  },
  {
    competitorId: 'comp_base_vn',
    name: 'Base.vn (Wework / Request)',
    targetMarket: 'Doanh nghiệp công nghệ, dịch vụ quy mô vừa',
    startingPriceVndMonth: 600000,
    weaknesses: ['Chi phí chia theo từng app rời rạc', 'Thiếu module kế toán kép VAS 200 chuyên sâu', 'Không có autonomous self-healing code'],
    strengths: ['UI/UX hiện đại, quy trình duyệt Request tốt'],
    ourUspAdvantage: 'Hệ điều hành All-in-One: Tích hợp sẵn Phê duyệt HITL, Kế toán kép, Xưởng Sản phẩm và AI Swarm.',
    lastScannedAt: new Date().toISOString(),
  },
];

export default function MarketIntelligencePanel() {
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>(DEFAULT_COMPETITORS);
  const [selectedComp, setSelectedComp] = useState<CompetitorProfile>(DEFAULT_COMPETITORS[0]);
  const [loading, setLoading] = useState(false);

  const fetchRadar = async () => {
    try {
      const res = await fetch('/api/dormant/market/competitor-radar');
      const data = await res.json();
      if (data?.success && data?.competitors) {
        setCompetitors(data.competitors);
      }
    } catch {
      // fallback to seed
    }
  };

  useEffect(() => {
    fetchRadar();
  }, []);

  const handleScanNow = async () => {
    setLoading(true);
    try {
      await fetch('/api/dormant/market/intelligence-scan', { method: 'POST' });
      await fetchRadar();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Radar className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Radar Đối Thủ Cạnh Tranh & Battle Cards Bán Hàng</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Chiến Lược Thắng Thầu
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Quét và đối chiếu tự động tính năng, giá bán và điểm yếu của đối thủ thị trường (MISA, Fast, Base.vn) để cung cấp kịch bản chốt deal sắc bén cho AI Sales.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleScanNow}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Đang quét radar...' : 'Quét Thị Trường & Cập Nhật Giá'}</span>
          </button>
        </div>
      </section>

      {/* Competitor Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {competitors.map((comp) => (
          <button
            key={comp.competitorId}
            type="button"
            onClick={() => setSelectedComp(comp)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 backdrop-blur-xl ${
              selectedComp.competitorId === comp.competitorId
                ? 'bg-rose-500/15 border-rose-400/50 shadow-lg shadow-rose-500/10'
                : 'bg-slate-950/70 hover:bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-white">{comp.name}</span>
              <span className="text-xs text-rose-300 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                {formatMoneyVN(comp.startingPriceVndMonth, ' đ/th')}
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">{comp.targetMarket}</p>
          </button>
        ))}
      </div>

      {/* Selected Competitor Battle Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Battle Card Bán Hàng: Đối đầu với {selectedComp.name}</h2>
              <p className="text-xs text-slate-400">Phân khúc mục tiêu: {selectedComp.targetMarket}</p>
            </div>
          </div>

          <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            ⚡ Ưu thế chi phí: Tiết kiệm 75% ngân sách
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weaknesses */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2.5">
            <h3 className="text-xs font-black text-rose-300 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Điểm yếu của {selectedComp.name} (Khai thác khi bán hàng)</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedComp.weaknesses.map((w, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Strengths */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-black text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Điểm mạnh cần tôn trọng</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedComp.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Our Winning USP */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-emerald-950/40 border border-emerald-500/30 space-y-2">
          <h3 className="text-xs font-black text-emerald-300 flex items-center gap-2 uppercase tracking-wider">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Đòn Bẩy Chiến Thắng Của LedgerFlow Studio (Our Killer USP)</span>
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {selectedComp.ourUspAdvantage}
          </p>
        </div>

        {/* Objection Handling Script */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Kịch Bản Xử Lý Từ Chối (Objection Handling Script)</h3>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
            <div className="text-amber-300 font-semibold flex items-center gap-2">
              <span>❓ Khách hỏi:</span>
              <span>"Chúng tôi đã dùng {selectedComp.name} nhiều năm, chuyển đổi có phức tạp không?"</span>
            </div>
            <div className="text-slate-200 pl-4 border-l-2 border-emerald-500 text-xs leading-relaxed">
              💡 <strong>AI Sales đáp:</strong> "LedgerFlow hỗ trợ tính năng <em>1-Click Data Migration</em> tự động nhập toàn bộ số dư và danh mục từ file Excel/XML xuất từ {selectedComp.name} trong chưa đầy 30 giây mà không cần cấu hình lại."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
