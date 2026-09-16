import React, { useEffect, useState } from 'react';
import {
  FileText,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Download,
  Send,
  Zap,
  PenTool,
  ShieldCheck,
  Scale,
  ArrowUpRight,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface ContractDocument {
  contractId: string;
  title: string;
  contractType: string;
  partyName: string;
  contractValueVnd: number;
  riskScore: string;
  status: string;
  flaggedClausesCount: number;
  lastUpdated: string;
}

export default function ContractLifecyclePanel() {
  const [contracts, setContracts] = useState<ContractDocument[]>([]);
  const [totalPipeline, setTotalPipeline] = useState(630000000);
  const [resolvedCount, setResolvedCount] = useState(18);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/clm/contracts');
      const data = await res.json();
      if (data?.success) {
        setContracts(data.contracts || []);
        setTotalPipeline(data.totalPipelineValueVnd || 630000000);
        setResolvedCount(data.redlinedClausesResolved || 18);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleSign = async (contractId: string) => {
    try {
      await fetch('/api/dormant/clm/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      });
      await fetchData();
    } catch {
      // ignore
    }
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
                <h1 className="text-xl font-black tracking-tight text-white">Quản Trị Vòng Đời Hợp Đồng (CLM & Redline Shield)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Redline Active
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Tự động rà quét và cảnh báo điều khoản rủi ro pháp lý (bồi thường, chậm trả), kích hoạt chữ ký số 1-Chạm có mã băm SHA-256.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              e-Signature Ready
            </span>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-950 to-indigo-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Giá Trị Hợp Đồng</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-300 font-mono">
            {formatMoneyVN(totalPipeline, ' đ')}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">SaaS Enterprise &amp; Dịch vụ</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điều Khoản Đã Xử Lý</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            {resolvedCount} <span className="text-xs text-slate-400 font-normal">điều khoản</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">AI Redline tự động tối ưu</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 to-cyan-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chữ Ký Số e-Signature</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300 font-mono">
            100% Hợp Chuẩn
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Audit Trail SHA-256</p>
        </div>
      </div>

      {/* Contracts Feed */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Danh Sách Hợp Đồng Cần Ký &amp; Phê Duyệt</h2>
          <span className="text-xs text-slate-400">{contracts.length} tài liệu</span>
        </div>

        <div className="space-y-3">
          {contracts.map((c) => (
            <div
              key={c.contractId}
              className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {c.contractType}
                    </span>
                    <h3 className="text-xs font-bold text-white">{c.title}</h3>
                  </div>
                  <div className="text-xs text-slate-400">
                    Đối tác: <strong className="text-slate-200">{c.partyName}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white font-mono">
                      {formatMoneyVN(c.contractValueVnd, ' đ')}
                    </div>
                    <div className="text-[10px] mt-0.5">
                      {c.flaggedClausesCount > 0 ? (
                        <span className="text-amber-400 font-bold">{c.flaggedClausesCount} điều khoản cảnh báo</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">An toàn pháp lý 100%</span>
                      )}
                    </div>
                  </div>

                  {c.status === 'EXECUTED' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ĐÃ KÝ SỐ</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleSign(c.contractId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Ký Số Ngay</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-800/80">
                <span>
                  Mức độ rủi ro:{' '}
                  <strong className={c.riskScore === 'LOW' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {c.riskScore}
                  </strong>
                </span>
                <span className="text-slate-500">Cập nhật: {new Date(c.lastUpdated).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
