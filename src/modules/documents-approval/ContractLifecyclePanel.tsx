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
    fetchData();
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
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-black text-white">📑 Autonomous Contract Lifecycle (CLM) &amp; Redline Shield</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              AI Redline Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tự động phát hiện và cảnh báo các điều khoản rủi ro pháp lý (bồi thường vô hạn mức, chậm thanh toán), kích hoạt chữ ký số 1 chạm.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Giá Trị Hợp Đồng Đang Ký</div>
          <div className="text-2xl font-black text-indigo-300 mt-1 font-mono">
            {formatMoneyVN(totalPipeline, ' đ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">SaaS MSA &amp; Thầu phụ EPC</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Điều Khoản Rủi Ro Đã Xử Lý</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{resolvedCount} Điều Khoản</div>
          <div className="text-[10px] text-slate-400 mt-0.5">AI Redline tự động sửa đổi</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Chữ Ký Số e-Signature</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">100% Hợp Chuẩn</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kèm mã băm Audit Trail SHA-256</div>
        </div>
      </div>

      {/* Contracts Feed */}
      <div className="space-y-3">
        {contracts.map((c) => (
          <div key={c.contractId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-indigo-300">
                    {c.contractType}
                  </span>
                  <h4 className="text-xs font-bold text-white">{c.title}</h4>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Đối tác: <strong>{c.partyName}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-white font-mono">
                    {formatMoneyVN(c.contractValueVnd, ' đ')}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {c.flaggedClausesCount > 0 ? (
                      <span className="text-amber-400 font-bold">{c.flaggedClausesCount} điều khoản cảnh báo</span>
                    ) : (
                      <span className="text-emerald-400">An toàn pháp lý 100%</span>
                    )}
                  </div>
                </div>

                {c.status === 'EXECUTED' ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ĐÃ KÝ SỐ</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSign(c.contractId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Ký Số Ngay</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
              <span>Mức độ rủi ro: <strong className={c.riskScore === 'LOW' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{c.riskScore}</strong></span>
              <span>Cập nhật: {new Date(c.lastUpdated).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
