import React, { useEffect, useState } from 'react';
import { FileText, ShieldAlert, Sparkles, Scale, ShieldCheck, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { getContractAudit, analyzeContract } from '../../utils/enterpriseApi';

interface Contract {
  contractId: string;
  contractName: string;
  counterparty: string;
  contractValueVnd: number;
  riskScore: number;
  status: string;
  redFlags: string[];
}

const CONTRACTS: Contract[] = [
  {
    contractId: 'CTR-2026-081',
    contractName: 'Enterprise SaaS Agreement — Vinaconex 3',
    counterparty: 'Công ty CP Xây dựng Vinaconex 3',
    contractValueVnd: 450_000_000,
    riskScore: 12,
    status: 'ACTIVE',
    redFlags: ['Quy định phạt thanh toán chậm 0.05%/ngày (Hợp lý)']
  },
  {
    contractId: 'CTR-2026-082',
    contractName: 'Cloud Server Infrastructure Agreement — Hetzner / AWS',
    counterparty: 'Amazon Web Services Inc.',
    contractValueVnd: 180_000_000,
    riskScore: 8,
    status: 'ACTIVE',
    redFlags: []
  },
  {
    contractId: 'CTR-2026-083',
    contractName: 'Strategic Distribution Partnership — Base Vietnam Co-Sell',
    counterparty: 'Base Technology JSC',
    contractValueVnd: 600_000_000,
    riskScore: 24,
    status: 'UNDER REVIEW',
    redFlags: ['Điều khoản độc quyền phân phối tại miền Bắc (Cần đàm phán lại)']
  }
];

export default function AiContractIntelligencePanel() {
  const [analyzedId, setAnalyzedId] = useState<string | null>(null);
  const [contracts, setContracts] = useState<Contract[]>(CONTRACTS);

  useEffect(() => {
    getContractAudit().then((d) => {
      if (d.contracts?.length) setContracts(d.contracts);
    }).catch(() => {});
  }, []);

  const handleAnalyze = (id: string) => {
    setAnalyzedId(analyzedId === id ? null : id);
    analyzeContract(id).catch(() => {});
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Scale className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Trí Tuệ Hợp Đồng &amp; Đánh Giá Rủi Ro Pháp Lý AI (Contract Intelligence)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Legal AI Guard
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Tự động rà soát hợp đồng MSA/NDA — Phát hiện điều khoản bất lợi và chấm điểm rủi ro pháp lý theo luật Việt Nam &amp; Quốc tế.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              14.6/100 Điểm Rủi Ro (An Toàn)
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-950 to-sky-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hợp Đồng Hoạt Động</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-300 font-mono">
            {contracts.length} Hợp Đồng
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">SaaS, Cloud, Partnership</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Giá Trị Hợp Đồng</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            1.23 Tỷ VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">100% đối soát tự động</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm Rủi Ro Trung Bình</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            14.6/100
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Mức an toàn cao</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hết Hạn Trong 30 Ngày</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            0 Hợp Đồng
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Không có hợp đồng cần gia hạn gấp</p>
        </div>
      </div>

      {/* Contract Intelligence Ledger */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Sổ Cái Giám Sát Rủi Ro Hợp Đồng
            </h2>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {contracts.map((ctr) => {
            const isOpen = analyzedId === ctr.contractId;
            return (
              <div key={ctr.contractId} className="p-5 hover:bg-slate-800/20 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-white">{ctr.contractName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {ctr.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Đối tác: <strong className="text-slate-300">{ctr.counterparty}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {(ctr.contractValueVnd / 1e6).toFixed(0)}M VND
                    </span>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border ${
                      ctr.riskScore < 20
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    }`}>
                      Rủi ro: {ctr.riskScore}/100
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAnalyze(ctr.contractId)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-600/80 hover:bg-indigo-600 text-white transition-all cursor-pointer shadow-md shadow-indigo-500/20"
                    >
                      <span>{isOpen ? 'Đóng' : 'Xem Pháp Lý AI'}</span>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 text-xs text-slate-300 animate-fade-in space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Kết Quả Đánh Giá Pháp Lý Tự Động Từ AI:</span>
                    </div>
                    <p className="leading-relaxed">
                      {ctr.redFlags.length > 0
                        ? ctr.redFlags.join(' · ')
                        : 'Không phát hiện điều khoản bất lợi. Hợp đồng tuân thủ đầy đủ điều khoản bảo mật, giới hạn bồi thường và cơ chế trọng tài VIAC.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
