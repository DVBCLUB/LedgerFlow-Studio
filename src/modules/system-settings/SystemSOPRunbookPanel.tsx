import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Play,
  Activity,
  FileText,
  Clock,
  RefreshCw,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function SystemSOPRunbookPanel() {
  const [categories, setCategories] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('sop_daily_cadence');
  const [selectedScenario, setSelectedScenario] = useState<
    'ai_provider_outage' | 'database_corruption' | 'ci_build_failure' | 'token_budget_breach'
  >('ai_provider_outage');
  const [drillReport, setDrillReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSOPData = useCallback(async () => {
    try {
      const [runbooksRes, compRes] = await Promise.all([
        fetch('/api/sop/runbooks').then((r) => r.json()),
        fetch('/api/sop/compliance').then((r) => r.json()),
      ]);
      if (runbooksRes.success) setCategories(runbooksRes.categories);
      if (compRes.success) setCompliance(compRes.compliance);
    } catch (err) {
      console.error('[SOP] Load error:', err);
    }
  }, []);

  useEffect(() => {
    void loadSOPData();
  }, [loadSOPData]);

  const handleRunDrill = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sop/drill/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: selectedScenario }),
      }).then((r) => r.json());
      if (res.success) setDrillReport(res.report);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-emerald-500/20 bg-slate-950/80 p-6 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 text-emerald-300 border border-emerald-500/40 shadow-inner">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Quy Trình Vận Hành Chuẩn (SOP &amp; Runbooks)</h2>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-300 border border-emerald-500/30">
                Tuân Thủ 100%
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Chuẩn hóa quy trình vận hành ngay từ đầu: Nhịp làm việc hàng ngày, xử lý sự cố 24/7, kiểm soát chất lượng AI và bảo mật độc lập.
            </p>
          </div>
        </div>

        {compliance && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Điểm Tuân Thủ SOP</span>
              <span className="text-xl font-black text-emerald-400">{compliance.overallScore}%</span>
            </div>
            <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> {compliance.status}
            </span>
          </div>
        )}
      </div>

      {/* 1-Click Automated Incident Drill */}
      <div className="rounded-3xl border border-amber-500/30 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" /> Diễn Tập Khắc Phục Sự Cố Khẩn Cấp 1-Click (Incident Recovery Drill)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kiểm tra khả năng tự chuyển vùng AI, khôi phục database snapshot, hoặc chẩn đoán CI khi có sự cố thực tế.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as any)}
              className="rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-bold text-white"
            >
              <option value="ai_provider_outage">1. AI Provider Sập Mạng / 429 Rate Limit</option>
              <option value="database_corruption">2. Lỗi Cơ Sở Dữ Liệu SQLite</option>
              <option value="ci_build_failure">3. Build GitHub Actions Thất Bại</option>
              <option value="token_budget_breach">4. Chạm Trần Ngân Sách Token AI</option>
            </select>
            <button
              onClick={handleRunDrill}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-500 cursor-pointer disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" /> {loading ? 'Đang diễn tập...' : 'Chạy Diễn Tập'}
            </button>
          </div>
        </div>

        {drillReport && (
          <div className="rounded-2xl border border-amber-500/30 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300">
                Kịch bản: {drillReport.scenario} — Phản hồi: {drillReport.responseTimeMs}ms
              </span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                ✓ Trạng thái: {drillReport.status}
              </span>
            </div>
            <div className="space-y-1 font-mono text-[11px] text-slate-300 bg-slate-900 p-3 rounded-xl">
              {drillReport.recoveryLog.map((log: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <Terminal className="h-3 w-3 text-cyan-400 shrink-0" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-emerald-400">💡 {drillReport.actionRecommendation}</p>
          </div>
        )}
      </div>

      {/* 5 SOP Categories Accordion */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const isExpanded = expandedCategory === cat.categoryId;
          return (
            <div
              key={cat.categoryId}
              className="rounded-2xl border border-border-primary bg-slate-900/60 overflow-hidden transition"
            >
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat.categoryId)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-emerald-400 font-black text-xs border border-border-secondary">
                    {cat.categoryId.includes('daily') ? '01' : cat.categoryId.includes('incident') ? '02' : cat.categoryId.includes('quality') ? '03' : cat.categoryId.includes('security') ? '04' : '05'}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">{cat.title}</h4>
                    <p className="text-[11px] text-slate-400">{cat.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                    cat.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {cat.priority}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border-secondary p-4 bg-slate-950/60 space-y-3">
                  <div className="grid gap-2.5">
                    {cat.steps.map((step: any) => (
                      <div
                        key={step.id}
                        className="rounded-xl border border-border-secondary bg-slate-900/80 p-3.5 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span className="text-xs font-black text-white">{step.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 ml-6">{step.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-300">
                            {step.executor}
                          </span>
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                            {step.frequency}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
