import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Zap,
  ArrowRight,
  Flame,
  FileSpreadsheet,
  TrendingDown,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface FinancialIncident {
  incidentId: string;
  type: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  triggerReason: string;
  impactAmountVnd: number;
  status: 'OPEN' | 'AUTO_CONTAINED' | 'RESOLVED';
  actionsExecuted: string[];
  hitlActionRequired: string;
  createdAt: string;
  resolvedAt?: string;
}

export default function FinancialIncidentPlaybookPanel() {
  const [incidents, setIncidents] = useState<FinancialIncident[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/dormant/finance/incidents');
      const data = await res.json();
      if (data?.success && data?.incidents) {
        setIncidents(data.incidents);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleScan = async () => {
    setLoading(true);
    try {
      await fetch('/api/dormant/finance/scan-incidents', { method: 'POST' });
      await fetchIncidents();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (incidentId: string) => {
    try {
      await fetch('/api/dormant/finance/resolve-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId }),
      });
      await fetchIncidents();
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
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-black text-white">🚨 Financial Incident Response &amp; Autonomous Playbooks</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              2-Sigma Guard
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tự động kích hoạt kịch bản phong tỏa khi phát hiện dòng tiền bất thường (GPU burn spike, sai lệch thuế VAT, nợ quá hạn).
          </p>
        </div>

        <button
          onClick={handleScan}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Đang kiểm toán...' : '⚡ Quét Bất Thường Dòng Tiền'}</span>
        </button>
      </div>

      {/* Incident Feed */}
      <div className="space-y-3">
        {incidents.map((inc) => (
          <div
            key={inc.incidentId}
            className={`p-4 rounded-xl border transition space-y-3 ${
              inc.status === 'RESOLVED'
                ? 'bg-white/2 border-white/6 opacity-75'
                : 'bg-rose-950/20 border-rose-500/30'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      inc.severity === 'CRITICAL'
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <h4 className="text-sm font-bold text-white">{inc.title}</h4>
                </div>
                <p className="text-xs text-slate-300">{inc.triggerReason}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Giá trị tác động</div>
                  <div className="text-sm font-black text-rose-400 font-mono">
                    {formatMoneyVN(inc.impactAmountVnd, ' đ')}
                  </div>
                </div>

                {inc.status !== 'RESOLVED' ? (
                  <button
                    onClick={() => handleResolve(inc.incidentId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Duyệt &amp; Đóng sự cố</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã giải quyết</span>
                  </span>
                )}
              </div>
            </div>

            {/* Actions Executed & HITL Step */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs">
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Lock className="w-3 h-3 text-cyan-400" />
                  <span>Hành động tự động đã thực thi:</span>
                </span>
                <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                  {inc.actionsExecuted.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Yêu cầu Người sáng lập (HITL Requirement):</span>
                </span>
                <p className="text-[11px] text-amber-200">{inc.hitlActionRequired}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
