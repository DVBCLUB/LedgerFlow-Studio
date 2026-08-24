import React, { useEffect, useState } from 'react';
import {
  GitBranch,
  Building2,
  PlusCircle,
  TrendingUp,
  Users,
  Database,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
  Sparkles,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface VirtualBranch {
  branchId: string;
  name: string;
  code: string;
  industryTemplate: string;
  accountingStandard: string;
  status: string;
  mrrVnd: number;
  activeAgentsCount: number;
  totalTransactionsCount: number;
  healthScore: number;
  createdAt: string;
}

export default function VirtualBranchManagerPanel() {
  const [branches, setBranches] = useState<VirtualBranch[]>([]);
  const [consolidatedMRR, setConsolidatedMRR] = useState(0);
  const [totalAgents, setTotalAgents] = useState(0);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [industryTemplate, setIndustryTemplate] = useState<'B2B_SAAS' | 'CONSTRUCTION_EPC' | 'TRADING_DISTRIBUTION' | 'DIGITAL_AGENCY'>('B2B_SAAS');
  const [accountingStandard, setAccountingStandard] = useState<'TT133_SME' | 'TT200_CORP' | 'IFRS_GLOBAL'>('TT200_CORP');

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/dormant/branches/list');
      const data = await res.json();
      if (data?.success) {
        setBranches(data.branches || []);
        setConsolidatedMRR(data.consolidatedMRRVnd || 0);
        setTotalAgents(data.totalActiveAgents || 0);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    try {
      await fetch('/api/dormant/branches/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code,
          industryTemplate,
          accountingStandard,
        }),
      });
      setShowCloneModal(false);
      setName('');
      setCode('');
      await fetchBranches();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-black text-white">🏢 Multi-Tenant Virtual Branch &amp; Franchise OS Cloner</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Holding Rollup
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Nhân bản và vận hành song song nhiều công ty con, chi nhánh với hệ thống sổ cái kế toán (TT133, TT200) và Swarm Agent độc lập.
          </p>
        </div>

        <button
          onClick={() => setShowCloneModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Nhân Bản Chi Nhánh Mới (1-Click)</span>
        </button>
      </div>

      {/* Holding Consolidated Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng MRR Hợp Nhất (Holding)</div>
          <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
            {formatMoneyVN(consolidatedMRR, ' đ/tháng')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{branches.length} Chi nhánh hoạt động</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Lực Lượng AI Swarm</div>
          <div className="text-xl font-black text-cyan-300 mt-1">{totalAgents} AI Staff</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Phân bổ theo domain chi nhánh</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Chuẩn Kế Toán Đa Chi Nhánh</div>
          <div className="text-xl font-black text-purple-300 mt-1">TT200 &amp; TT133</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tự động hợp nhất BCTC</div>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map((branch) => (
          <div key={branch.branchId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                  {branch.code}
                </span>
                <h4 className="text-xs font-bold text-white mt-1">{branch.name}</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                {branch.status}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Mẫu ngành:</span>
                <span className="font-semibold text-white">{branch.industryTemplate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chuẩn mực VAS:</span>
                <span className="font-semibold text-white">{branch.accountingStandard}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Doanh thu MRR:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatMoneyVN(branch.mrrVnd, ' đ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AI Swarm nhân sự:</span>
                <span className="font-bold text-cyan-300">{branch.activeAgentsCount} Agents</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Sức khỏe: <strong className="text-emerald-400">{branch.healthScore}/100</strong></span>
              <span>Giao dịch: <strong className="text-white">{branch.totalTransactionsCount}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nhân bản chi nhánh mới */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleClone} className="w-full max-w-md p-6 rounded-2xl bg-[#141420] border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white">Khởi Tạo Virtual Branch / Franchise Mới</h3>
            
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Tên chi nhánh / Công ty con</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Chi Nhánh Phân Phối Đà Nẵng"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Mã chi nhánh (Code)</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ví dụ: LF-DN-DIST"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white font-mono uppercase"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Mẫu ngành</label>
                <select
                  value={industryTemplate}
                  onChange={(e: any) => setIndustryTemplate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
                >
                  <option value="B2B_SAAS">B2B SaaS / Tech</option>
                  <option value="CONSTRUCTION_EPC">Xây dựng &amp; EPC</option>
                  <option value="TRADING_DISTRIBUTION">Thương mại &amp; Kho</option>
                  <option value="DIGITAL_AGENCY">Digital Agency</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Chuẩn VAS</label>
                <select
                  value={accountingStandard}
                  onChange={(e: any) => setAccountingStandard(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
                >
                  <option value="TT200_CORP">Thông tư 200</option>
                  <option value="TT133_SME">Thông tư 133</option>
                  <option value="IFRS_GLOBAL">IFRS Global</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCloneModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
              >
                Tạo Ngay
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
