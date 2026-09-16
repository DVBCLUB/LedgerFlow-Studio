import React from 'react';
import { ShieldAlert, Activity, Bot, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';

export default function DailyBlockersPanel() {
  const blockers: Array<{id: string; title: string; description: string; severity: 'critical' | 'warning' | 'overdue'; action: string}> = [
    { id: 'HD-2026-088', title: 'Hop dong B2B SaaS Doanh Nghiep #HD-2026-088',
      description: 'Khach hang Vingroup - Gia tri: 45.000.000 d - Cho duyet dieu khoan SLA',
      severity: 'critical', action: 'Duyet Ngay' },
    { id: 'PR-142', title: 'AI SWE-Agent PR #142 (Bao Mat API Gateway)',
      description: 'Da vuot qua 100% unit tests - Can CEO ky xac nhan phat hanh len Production',
      severity: 'warning', action: 'Phe Duyet' },
    { id: 'DEV-089', title: 'AI Dev Task #089 - Tich Hop Module Thanh Toan',
      description: 'Tre 2 ngay so voi deadline - Blocked boi cho API doi tac ngan hang',
      severity: 'overdue', action: 'Xem Chi Tiet' },
  ];

  const sevCfg: Record<'critical' | 'warning' | 'overdue', {dot: string; border: string; badge: string; label: string}> = {
    critical: { dot: 'bg-rose-400 animate-ping', border: 'border-rose-500/30 hover:border-rose-500/50', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', label: 'CAP BACH' },
    warning: { dot: 'bg-amber-400', border: 'border-amber-500/20 hover:border-amber-500/40', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'CAN DUYET' },
    overdue: { dot: 'bg-orange-400', border: 'border-orange-500/20 hover:border-orange-500/40', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'TRE HAN' },
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/20 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-lg">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">Diem Nghen & Critical Path</h1>
              <p className="mt-1 text-sm text-slate-400">3 viec can CEO quyet dinh de thong luong van hanh hom nay</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black shrink-0">HOM NAY</span>
        </div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-rose-500/20 bg-slate-950/80 p-3.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400"><AlertTriangle className="h-4 w-4" /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blockers</p><p className="text-lg font-black text-rose-300">{blockers.length}</p></div>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-slate-950/80 p-3.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400"><Clock className="h-4 w-4" /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tre Deadline</p><p className="text-lg font-black text-amber-300">2</p></div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-slate-950/80 p-3.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><CheckCircle className="h-4 w-4" /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hoan Thanh Hom Nay</p><p className="text-lg font-black text-emerald-300">5</p></div>
          </div>
        </div>
      </section>
      <div className="space-y-2.5">
        {blockers.map((item) => {
          const c = sevCfg[item.severity];
          const clr = item.severity === 'critical' ? '#f43f5e' : item.severity === 'warning' ? '#f59e0b' : '#f97316';
          return (
            <div key={item.id} className={'flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border ' + c.border}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className={'absolute inline-flex h-full w-full rounded-full opacity-60 ' + (item.severity === 'critical' ? 'animate-ping' : '')} style={{ background: clr }} />
                  <span className={'relative inline-flex rounded-full h-2.5 w-2.5 ' + c.dot} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white truncate">{item.title}</span>
                    <span className={'text-[9px] font-black px-1.5 py-0.5 rounded-full border ' + c.badge}>{c.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                </div>
              </div>
              <button type="button" onClick={() => alert('Da xu ly: ' + item.title)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black cursor-pointer shadow-md shrink-0 ml-3 transition-all">
                <span>{item.action}</span><ArrowRight className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
      <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/20 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400"><Bot className="h-4 w-4" /></div>
          <h2 className="text-xs font-black tracking-tight text-white uppercase">AI Dev / Human Dev - Task Tre Deadline</h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <div><span className="text-xs font-bold text-white">Tich Hop API Thanh Toan VNPay</span><span className="text-[10px] text-slate-400 ml-2">AI Dev - Tre 3 ngay</span></div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold">-3d</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <div><span className="text-xs font-bold text-white">Bao Cao Tai Chinh Thang 8</span><span className="text-[10px] text-slate-400 ml-2">Human Dev - Tre 1 ngay</span></div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold">-1d</span>
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400"><Activity className="h-4 w-4" /></div>
            <div><h2 className="text-xs font-black tracking-tight text-white uppercase">Chi Phi Van Hanh Tuan Nay</h2><p className="text-[10px] text-slate-400">Server + AI API - Trong ngan sach</p></div>
          </div>
          <div className="text-right"><p className="text-sm font-black text-emerald-400">$12.80</p><p className="text-[10px] text-slate-500">/ $100.00 budget</p></div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full w-[12.8%] rounded-full bg-emerald-500 transition-all duration-500" />
        </div>
      </section>
    </div>
  );
}
