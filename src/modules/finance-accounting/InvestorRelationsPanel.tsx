import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  PieChart as PieIcon,
  Users,
  DollarSign,
  Send,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface CapTableShareholder {
  shareholderId: string;
  name: string;
  role: string;
  sharesCount: number;
  ownershipPercentage: number;
  investmentAmountVnd: number;
}

export interface InvestorUpdateReport {
  reportId: string;
  period: string;
  arrVnd: number;
  mrrGrowthRatePercent: number;
  burnRateVnd: number;
  runwayMonths: number;
  keyWins: string[];
  keyAsks: string[];
  generatedAt: string;
}

export default function InvestorRelationsPanel() {
  const [capTable, setCapTable] = useState<CapTableShareholder[]>([]);
  const [totalShares, setTotalShares] = useState(0);
  const [valuation, setValuation] = useState(25000000000);
  const [report, setReport] = useState<InvestorUpdateReport | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/investors/data');
      const data = await res.json();
      if (data?.success) {
        setCapTable(data.capTable || []);
        setTotalShares(data.totalShares || 0);
        setValuation(data.postMoneyValuationVnd || 25000000000);
        setReport(data.latestInvestorUpdate || null);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">💼 Autonomous Investor Relations &amp; Cap Table Equity Simulator</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Pre-Seed $1M
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mô phỏng cơ cấu sở hữu cổ phần (Cap Table), pha loãng khi gọi vốn và tự động tổng hợp báo cáo định kỳ gửi nhà đầu tư.
          </p>
        </div>
      </div>

      {/* Valuation Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Định Giá Doanh Nghiệp (Post-Money)</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
            {formatMoneyVN(valuation, ' đ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tương đương ~ 1.000.000 USD</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Số Cổ Phần Phát Hành</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{totalShares.toLocaleString()} Shares</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mệnh giá chuẩn 1.000 VND / CP</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tăng Trưởng MRR Hàng Tháng</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">+{report?.mrrGrowthRatePercent}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Runway an toàn: {report?.runwayMonths} tháng</div>
        </div>
      </div>

      {/* Cap Table Breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cơ Cấu Sở Hữu Cổ Phần (Cap Table)</h3>
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/8 text-slate-400">
              <tr>
                <th className="p-3">Cổ Đông / Nhà Đầu Tư</th>
                <th className="p-3">Vai Trò</th>
                <th className="p-3">Số Cổ Phần</th>
                <th className="p-3">Tỷ Lệ Sở Hữu</th>
                <th className="p-3">Vốn Đầu Tư</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {capTable.map((row) => (
                <tr key={row.shareholderId} className="hover:bg-white/2">
                  <td className="p-3 font-bold text-white">{row.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-cyan-300">
                      {row.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{row.sharesCount.toLocaleString()}</td>
                  <td className="p-3 font-mono font-bold text-amber-300">{row.ownershipPercentage}%</td>
                  <td className="p-3 font-mono text-emerald-400">
                    {formatMoneyVN(row.investmentAmountVnd, ' đ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investor Digest Report Preview */}
      {report && (
        <div className="p-4 rounded-xl bg-black/40 border border-white/8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Bản Tin Định Kỳ Gửi Nhà Đầu Tư ({report.period})
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">Tự Động Sinh Bởi AI</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <strong className="text-cyan-300">🚀 Điểm Sáng Trong Kỳ (Key Wins):</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                {report.keyWins.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-white/5">
              <strong className="text-amber-300">🤝 Yêu Cầu Hỗ Trợ Từ Nhà Đầu Tư (Key Asks):</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                {report.keyAsks.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
