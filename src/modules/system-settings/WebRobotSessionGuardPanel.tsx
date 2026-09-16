import React, { useEffect, useState } from 'react';
import { Bot, Shield, ShieldCheck, ShieldAlert, Globe, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getRobotSessions, WebRobotSession } from '../../utils/enterpriseApi';

const MOCK: WebRobotSession[] = [
  { id: 'sess_001', robotName: 'Facebook Ads Robot', targetWebUrl: 'https://business.facebook.com', sessionStatus: 'HEALTHY', lastKeepAliveAt: '2026-08-14T10:30:00Z', cookieExpiryDays: 24 },
  { id: 'sess_002', robotName: 'Zalo OA Agent', targetWebUrl: 'https://oa.zalo.me', sessionStatus: 'NEEDS_REFRESH', lastKeepAliveAt: '2026-08-13T09:15:00Z', cookieExpiryDays: 2 },
];

export default function WebRobotSessionGuardPanel() {
  const [sessions, setSessions] = useState<WebRobotSession[]>(MOCK);

  useEffect(() => {
    getRobotSessions().then((d) => {
      if (d.sessions?.length) setSessions(d.sessions);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Bot className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Giám Sát Phiên Web Automation Robot (Session Guard)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Keep-Alive Engine
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Giám sát phiên đăng nhập web automation — Tự động phát hiện cookie sắp hết hạn và duy trì keep-alive định kỳ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {sessions.length} Robot Đang Giám Sát
            </span>
          </div>
        </div>
      </section>

      {/* Sessions Table Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Danh Sách Phiên Đăng Nhập Tự Động ({sessions.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5">Tên Robot</th>
                <th className="px-5 py-3.5">Trang Đích (Target URL)</th>
                <th className="px-5 py-3.5">Trạng Thái Phiên</th>
                <th className="px-5 py-3.5">Hạn Cookie</th>
                <th className="px-5 py-3.5 text-right">Keep-Alive Gần Nhất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sessions.map((s) => {
                const isHealthy = s.sessionStatus === 'HEALTHY';
                const isWarning = s.sessionStatus === 'NEEDS_REFRESH';
                return (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                      <Bot className="w-4 h-4 text-slate-400" />
                      {s.robotName}
                    </td>
                    <td className="px-5 py-3.5 text-cyan-400 font-mono text-[11px]">
                      {s.targetWebUrl}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isHealthy
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-rose-400'}`} />
                        {s.sessionStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-medium font-mono">
                      {s.cookieExpiryDays} ngày
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(s.lastKeepAliveAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
