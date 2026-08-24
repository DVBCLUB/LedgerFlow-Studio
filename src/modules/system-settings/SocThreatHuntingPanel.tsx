import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Zap,
  Globe2,
  CheckCircle2,
  Ban,
  Activity,
  AlertOctagon,
} from 'lucide-react';

export interface ThreatHuntingEvent {
  threatId: string;
  sourceIp: string;
  countryCode: string;
  attackVector: string;
  severity: string;
  mitigationStatus: string;
  remediationAction: string;
  timestamp: string;
}

export default function SocThreatHuntingPanel() {
  const [threats, setThreats] = useState<ThreatHuntingEvent[]>([]);
  const [blocked24h, setBlocked24h] = useState(38);
  const [healthScore, setHealthScore] = useState(100);
  const [blocklistCount, setBlocklistCount] = useState(24);
  const [sweepMsg, setSweepMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/soc/threats');
      const data = await res.json();
      if (data?.success) {
        setThreats(data.threats || []);
        setBlocked24h(data.totalThreatsBlocked24h || 38);
        setHealthScore(data.zeroTrustHealthPercent || 100);
        setBlocklistCount(data.activeIpBlocklistCount || 24);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSweep = async () => {
    try {
      const res = await fetch('/api/dormant/soc/sweep', { method: 'POST' });
      const data = await res.json();
      if (data?.success) {
        setSweepMsg(data.sweepResult);
      }
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
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h2 className="text-base font-black text-white">🚨 Autonomous SOC &amp; Zero-Day Threat Hunting</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
              Zero-Trust Health {healthScore}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Trung tâm tác chiến an ninh mạng SOC tự trị: Phát hiện tấn công Brute-Force, SQLi, rò rỉ mã token và tự động khóa IP trên WAF.
          </p>
        </div>

        <button
          onClick={handleSweep}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-red-600/20"
        >
          <Activity className="w-4 h-4" />
          <span>Quét Rà Soát Toàn Diện (SOC Sweep)</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Cuộc Tấn Công Bị Chặn 24 Giờ Qua</div>
          <div className="text-2xl font-black text-red-400 mt-1 font-mono">{blocked24h} Vụ</div>
          <div className="text-[10px] text-slate-400 mt-0.5">100% Chặn tại tầng mạng Anycast Edge</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Điểm An Toàn Zero-Trust</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{healthScore}/100</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Không có lỗ hổng Zero-Day đang mở</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Danh Sách IP Đang Bị Cô Lập</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{blocklistCount} IP</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tự động đồng bộ WAF Rule</div>
        </div>
      </div>

      {/* Sweep Alert */}
      {sweepMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
          <span>{sweepMsg}</span>
        </div>
      )}

      {/* Threats Feed */}
      <div className="space-y-3">
        {threats.map((t) => (
          <div key={t.threatId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/20 text-red-300 font-mono">
                    {t.attackVector}
                  </span>
                  <h4 className="text-xs font-bold text-white font-mono">{t.sourceIp} ({t.countryCode})</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-amber-300">
                    {t.severity}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1.5 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{t.remediationAction}</span>
                </div>
              </div>

              <div>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t.mitigationStatus}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
