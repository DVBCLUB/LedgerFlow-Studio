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
    weaknesses: ['Chi phí bản quyền và bảo trì đắt đỏ', 'Giao diện truyền thống, thiếu AI tự động hóa', 'Không có tính năng sinh video marketing hay game asset'],
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
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-rose-400 animate-spin" />
            <h2 className="text-base font-black text-white">📡 Radar Đối Thủ Cạnh Tranh &amp; Battle Cards Bán Hàng</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Chiến Lược Thắng Thầu ($0 AI)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quét và đối chiếu tự động tính năng, giá bán và điểm yếu của đối thủ thị trường (MISA, Fast, Base.vn) để cung cấp kịch bản chốt deal sắc bén cho AI Sales.
          </p>
        </div>

        <button
          onClick={handleScanNow}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Đang quét radar...' : '⚡ Quét Thị Trường & Cập Nhật Giá'}</span>
        </button>
      </div>

      {/* Competitor Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {competitors.map((comp) => (
          <button
            key={comp.competitorId}
            onClick={() => setSelectedComp(comp)}
            className={`p-4 rounded-xl border text-left transition cursor-pointer space-y-2 ${
              selectedComp.competitorId === comp.competitorId
                ? 'bg-rose-500/15 border-rose-400/50 shadow-lg shadow-rose-500/10'
                : 'bg-white/4 hover:bg-white/6 border-white/8'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">{comp.name}</span>
              <span className="text-[10px] text-rose-300 font-mono">
                {formatMoneyVN(comp.startingPriceVndMonth, ' đ/th')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">{comp.targetMarket}</p>
          </button>
        ))}
      </div>

      {/* Selected Competitor Battle Card */}
      <div className="p-5 rounded-xl bg-black/40 border border-white/8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/8">
          <div>
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Battle Card Bán Hàng: Đối đầu với {selectedComp.name}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Phân khúc mục tiêu: {selectedComp.targetMarket}</p>
          </div>

          <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            Ưu thế chi phí: Tiết kiệm 75% ngân sách
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weaknesses */}
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
            <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Điểm yếu của {selectedComp.name} (Khai thác khi bán hàng)</span>
            </h4>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
              {selectedComp.weaknesses.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>

          {/* Strengths */}
          <div className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Điểm mạnh cần tôn trọng</span>
            </h4>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
              {selectedComp.strengths.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Our Winning USP */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-emerald-950/40 border border-emerald-500/30 space-y-2">
          <h4 className="text-xs font-black text-emerald-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Đòn Bẩy Chiến Thắng Của LedgerFlow Studio (Our Killer USP)</span>
          </h4>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {selectedComp.ourUspAdvantage}
          </p>
        </div>

        {/* Objection Handling Script */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Kịch Bản Xử Lý Từ Chối (Objection Handling Script)</h4>
          <div className="p-3 rounded-lg bg-white/3 border border-white/6 space-y-1.5 text-xs">
            <div className="text-amber-300 font-semibold">❓ Khách hỏi: "Chúng tôi đã dùng {selectedComp.name} nhiều năm, chuyển đổi có phức tạp không?"</div>
            <div className="text-slate-200 pl-4 border-l-2 border-emerald-500">
              💡 <strong>AI Sales đáp:</strong> "LedgerFlow hỗ trợ tính năng <em>1-Click Data Migration</em> tự động nhập toàn bộ số dư và danh mục từ file Excel/XML xuất từ {selectedComp.name} trong chưa đầy 30 giây mà không cần cấu hình lại."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
