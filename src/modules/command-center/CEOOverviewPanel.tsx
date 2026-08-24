import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileText,
  ShieldCheck,
  WalletCards,
  Activity,
  Calendar,
  Sparkles,
  TrendingUp,
  Cpu,
  Check,
  RefreshCw,
  ServerCog,
  Zap,
  ShieldAlert,
  Flame,
  Clock,
  XCircle,
  Eye,
  CheckCheck,
  Gamepad2,
  Film,
  Code2,
  Headphones,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import {
  checkDaemonHealth,
  fetchAgentRuns,
  fetchAuditLogs,
  fetchSweAgentMissions,
  runSweDockerDoctor,
  type AuditLogEntry,
  type SweMissionState,
} from '../../utils/assistantApi';
import {
  COMMAND_CENTER_ALERTS,
  COMMAND_CENTER_DECISION_QUEUE,
  COMMAND_CENTER_KPIS,
  COMMAND_CENTER_REPORT_TEMPLATES,
  COMMAND_CENTER_TODAY_PRIORITIES,
  COMMAND_CENTER_WORKFLOWS
} from '../../data/commandCenterKnowledge';
import MorningExecutiveBriefingCard from './components/MorningExecutiveBriefingCard';
import DecisionImpactGraph from './components/DecisionImpactGraph';
import CloudHybridWorkflowStatusPanel from '../../components/shared/CloudHybridWorkflowStatusPanel';
import MasterSystemHealthDashboard from '../../components/shared/MasterSystemHealthDashboard';
import ExecutiveBoardroomPanel from '../analytics-models-sandbox/ExecutiveBoardroomPanel';
import EnterpriseControlCenterPanel from '../../components/enterprise/EnterpriseControlCenterPanel';
import ExecutiveEarphoneModeModal from './components/ExecutiveEarphoneModeModal';
import SystemOSStateMap from './components/SystemOSStateMap';
import HITLApprovalInboxPanel from '../../components/shared/HITLApprovalInboxPanel';
import NaturalLanguageCommandBar from './components/NaturalLanguageCommandBar';
import LiveCompanyPulseBar from '../../components/shared/LiveCompanyPulseBar';
import UnifiedActivityStreamPanel from './components/UnifiedActivityStreamPanel';
import CompanyCalendarPanel from './components/CompanyCalendarPanel';
import DepartmentHealthPanel from './components/DepartmentHealthPanel';
import { useLanguage } from '../../context/LanguageContext';
import { formatMoneyVN, formatNumberVN } from '../../utils/excelFormatters';

const money = (value: number) => formatMoneyVN(value, '');

type DailyCommandSnapshot = {
  daemonOk: boolean;
  daemonHint: string;
  emergencyStop: boolean;
  waitingApproval: number;
  activeRuns: number;
  recentAudit: AuditLogEntry[];
  sweMissions: SweMissionState[];
  dockerOk: boolean | null;
  dockerSummary: string;
  loadedAt: string;
};

type ViewMode =
  | 'today'
  | 'inbox'
  | 'topology'
  | 'activity_stream'
  | 'calendar'
  | 'dept_health'
  | 'boardroom'
  | 'finance'
  | 'ai_ops'
  | 'risk_kpi'
  | 'enterprise';

export default function CEOOverviewPanel() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [copied, setCopied] = useState<string | null>(null);
  const [quarter, setQuarter] = useState<'all' | 'q1' | 'q2'>('all');
  const [dailySnapshot, setDailySnapshot] = useState<DailyCommandSnapshot | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState('');
  const [emergencyStopped, setEmergencyStopped] = useState<boolean>(false);
  const [isEarphoneOpen, setIsEarphoneOpen] = useState(false);

  // Decision Queue Interactive State
  const [decisionsState, setDecisionsState] = useState<Record<string, 'approved' | 'rejected' | 'pending'>>(() => {
    try {
      const saved = localStorage.getItem('lf_ceo_decisions_state');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleDecisionAction = (id: string, action: 'approved' | 'rejected') => {
    setDecisionsState((prev) => {
      const next = { ...prev, [id]: action };
      localStorage.setItem('lf_ceo_decisions_state', JSON.stringify(next));
      return next;
    });
  };

  const [aiRoi, setAiRoi] = useState<any | null>(null);
  const [crmSuggestions, setCrmSuggestions] = useState<any[]>([]);
  const [liveBoard, setLiveBoard] = useState<any | null>(null);
  const [capacityForecast, setCapacityForecast] = useState<any | null>(null);

  const refreshDailySnapshot = async () => {
    setDailyLoading(true);
    setDailyError('');
    try {
      const [healthResult, runsResult, auditResult, missionsResult, dockerResult, roiResult, crmResult, boardResult, forecastResult] = await Promise.allSettled([
        checkDaemonHealth(),
        fetchAgentRuns(20),
        fetchAuditLogs(8),
        fetchSweAgentMissions(8),
        runSweDockerDoctor(),
        fetch('/api/analytics/ai-roi?period=day').then((r) => r.json()),
        fetch('/api/crm/ai-scout/suggestions').then((r) => r.json()),
        fetch('/api/workforce/live-board').then((r) => r.json()),
        fetch('/api/capacity/forecast').then((r) => r.json()),
      ]);

      const health = healthResult.status === 'fulfilled' ? healthResult.value : null;
      const runs = runsResult.status === 'fulfilled' ? runsResult.value : null;
      const audit = auditResult.status === 'fulfilled' ? auditResult.value : [];
      const missions = missionsResult.status === 'fulfilled' ? missionsResult.value : [];
      const docker = dockerResult.status === 'fulfilled' ? dockerResult.value : null;

      if (roiResult.status === 'fulfilled' && roiResult.value?.success) {
        setAiRoi(roiResult.value.summary);
      }
      if (crmResult.status === 'fulfilled' && crmResult.value?.success) {
        setCrmSuggestions(crmResult.value.suggestions || []);
      }
      if (boardResult.status === 'fulfilled' && boardResult.value?.success) {
        setLiveBoard(boardResult.value.snapshot);
      }
      if (forecastResult.status === 'fulfilled' && forecastResult.value?.success) {
        setCapacityForecast(forecastResult.value.forecast);
      }

      const isEmergency = Boolean(runs?.emergencyStop);
      setEmergencyStopped(isEmergency);

      setDailySnapshot({
        daemonOk: Boolean(health?.ok),
        daemonHint: health?.hint || (healthResult.status === 'rejected' ? healthResult.reason?.message || 'Assistant daemon unavailable.' : 'Assistant daemon status unknown.'),
        emergencyStop: isEmergency,
        waitingApproval: runs?.runs.filter((run) => run.status === 'waiting_approval').length ?? 0,
        activeRuns: runs?.runs.filter((run) => run.status === 'running' || run.status === 'planned').length ?? 0,
        recentAudit: audit,
        sweMissions: missions,
        dockerOk: docker ? docker.ok : null,
        dockerSummary: docker?.summary || (dockerResult.status === 'rejected' ? dockerResult.reason?.message || 'Docker Doctor unavailable.' : 'Docker Doctor not checked.'),
        loadedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setDailyError(err?.message || 'Không tải được dữ liệu điều hành hôm nay.');
    } finally {
      setDailyLoading(false);
    }
  };

  useEffect(() => {
    void refreshDailySnapshot();
  }, []);

  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const toggleEmergencyStop = () => {
    setEmergencyStopped((prev) => !prev);
  };

  const dashboard = useMemo(() => {
    const plannedBudget = 8_500_000_000;
    const actualCost = 7_835_000_000;
    const advances = 920_000_000;
    const settled = 662_000_000;
    const missingDocs = 14;
    const totalFiles = 74;
    const remainingBudget = plannedBudget - actualCost;
    const monthlyBurnRate = 1_030_000_000; // ~1.03B per month
    const runwayMonths = parseFloat((remainingBudget / monthlyBurnRate).toFixed(1));

    return {
      plannedBudget,
      actualCost,
      remainingBudget,
      monthlyBurnRate,
      runwayMonths,
      advanceRatio: Math.round((settled / advances) * 100),
      missingDocRatio: Math.round((missingDocs / totalFiles) * 100),
      openAdvance: advances - settled
    };
  }, []);

  const chartData = useMemo(() => {
    if (quarter === 'q1') {
      return {
        revenue: [120, 150, 180],
        cashflow: [90, 130, 140],
        months: ['Thg 1', 'Thg 2', 'Thg 3']
      };
    }
    if (quarter === 'q2') {
      return {
        revenue: [210, 190, 250],
        cashflow: [170, 200, 220],
        months: ['Thg 4', 'Thg 5', 'Thg 6']
      };
    }
    return {
      revenue: [120, 150, 180, 210, 190, 250],
      cashflow: [90, 130, 140, 170, 200, 220],
      months: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6']
    };
  }, [quarter]);

  const bossBrief = `BÁO CÁO NHANH COMMAND CENTER\n\n1. Ngân sách còn lại: ${money(dashboard.remainingBudget)} VNĐ (Runway: ${dashboard.runwayMonths} tháng).\n2. Tỷ lệ hoàn ứng: ${dashboard.advanceRatio}%. Tạm ứng treo: ${money(dashboard.openAdvance)} VNĐ.\n3. Tỷ lệ hồ sơ thiếu: ${dashboard.missingDocRatio}%.\n4. Trạng thái AI: ${dailySnapshot?.daemonOk ? 'ONLINE' : 'CHECK'} | Runs đang chạy: ${dailySnapshot?.activeRuns || 0}.`;

  return (
    <div className="space-y-6 text-left select-none">
      {/* Top Cockpit Header Bar */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">CEO Control Cockpit</h1>
                <Badge variant="brand" className="text-[10px] uppercase font-bold tracking-wider">
                  Enterprise OS
                </Badge>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Bảng điều khiển chiến lược dành riêng cho Founder. Tập trung chốt việc, kiểm soát dòng tiền & an toàn AI.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Financial Runway Pill */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-950/70 border border-emerald-500/30 px-3 py-1.5">
              <Flame className="h-4 w-4 text-emerald-400" />
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Financial Runway</span>
                <span className="text-xs font-black text-emerald-300 font-mono">{formatNumberVN(dashboard.runwayMonths, 1)} tháng</span>
              </div>
            </div>

            {/* AI Master Safety Toggle */}
            <button
              type="button"
              onClick={toggleEmergencyStop}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-md ${
                emergencyStopped
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-200 animate-pulse'
                  : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/70'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>{emergencyStopped ? '🚨 AI STOPPED' : '✓ AI ACTIVE'}</span>
            </button>

            {/* Executive Voice Earphone Mode */}
            <button
              type="button"
              onClick={() => setIsEarphoneOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <Headphones className="h-3.5 w-3.5 animate-pulse" />
              <span>Tai nghe AI</span>
            </button>

            {/* Quick Refresh */}
            <Button
              onClick={() => void refreshDailySnapshot()}
              disabled={dailyLoading}
              variant="secondary"
              size="sm"
              className="px-3 py-1.5 text-xs gap-1.5 font-bold cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${dailyLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>

            {/* Copy Report */}
            <Button
              onClick={() => copyText('bossBrief', bossBrief)}
              variant="primary"
              size="sm"
              className="px-3.5 py-1.5 text-xs gap-1.5 font-bold shadow-lg cursor-pointer"
            >
              {copied === 'bossBrief' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === 'bossBrief' ? 'Đã copy' : 'Báo cáo nhanh'}
            </Button>
          </div>
        </div>

        {/* Phase 7: Real-Time SSE Company Pulse Bar */}
        <div className="mt-4">
          <LiveCompanyPulseBar />
        </div>

        {/* Level 6 Upgrade: Natural Language AI OS Command Bar */}
        <div className="mt-3">
          <NaturalLanguageCommandBar />
        </div>

        {/* Dynamic Mode Switcher Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('today')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'today'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{t('ceo.mode.today', '1. Việc cần chốt hôm nay')}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('activity_stream')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'activity_stream'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>⚡ Dòng sự kiện (Pulse)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>📅 Lịch Vận Hành</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('dept_health')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'dept_health'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>📊 Sức Khỏe 5 Khối</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('inbox')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'inbox'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>✋ Duyệt HITL</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('topology')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'topology'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>🌐 Neural Topology</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('boardroom')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'boardroom'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ServerCog className="h-3.5 w-3.5 text-indigo-300" />
              <span>{t('ceo.mode.boardroom', '2. Họp HĐQT AI')}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('finance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'finance'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{t('ceo.mode.finance', '3. Dòng tiền & Runway')}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('ai_ops')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'ai_ops'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>{t('ceo.mode.ai_ops', '4. Agent AI & Hệ thống')}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('risk_kpi')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'risk_kpi'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{t('ceo.mode.risk_kpi', '5. Rủi ro & Mô hình KPI')}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('enterprise')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'enterprise'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span>6. Voice Call &amp; Doanh Nghiệp NĐ13</span>
            </button>
          </div>

          {/* Quick status summary text */}
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
            <span>🔴 Daemon: <strong className={dailySnapshot?.daemonOk ? 'text-emerald-400' : 'text-amber-400'}>{dailySnapshot?.daemonOk ? 'Online' : 'Check'}</strong></span>
            <span>🤖 Active Runs: <strong className="text-indigo-300">{dailySnapshot?.activeRuns || 0}</strong></span>
            <span>⏳ Pending: <strong className="text-amber-300">{dailySnapshot?.waitingApproval || 0}</strong></span>
          </div>
        </div>
      </section>

      {/* MODE 1: VIỆC CẦN CHỐT HÔM NAY (EXECUTIVE TODAY FOCUS) */}
      {viewMode === 'today' && (
        <div className="space-y-6 animate-fade-in">
          {/* Morning Executive Briefing Card */}
          <MorningExecutiveBriefingCard />

          {/* AI ROI & Capital Efficiency Banner */}
          {aiRoi && (
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-white">Hiệu Quả Vốn AI (Capital Efficiency &amp; ROI)</h3>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-300 border border-emerald-500/30">
                      ROI: {aiRoi.roiMultiple}x
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Chi phí API: <strong className="text-white">${aiRoi.totalAiCostUsd}</strong> ({aiRoi.totalAiCostVnd.toLocaleString('vi-VN')} đ) → Doanh thu ước tính: <strong className="text-emerald-400">{aiRoi.totalRevenueVnd.toLocaleString('vi-VN')} đ</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-border-primary bg-slate-900/90 px-3 py-1.5 text-center">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Tạo ra trên $1 AI</span>
                  <span className="text-xs font-black text-emerald-300 font-mono">
                    {aiRoi.revenuePerDollarSpentVnd.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="rounded-xl border border-border-primary bg-slate-900/90 px-3 py-1.5 text-center">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Chi phí lớn nhất</span>
                  <span className="text-xs font-black text-cyan-300">
                    {aiRoi.topCostDriver?.roleName.substring(0, 14)} ({aiRoi.topCostDriver?.sharePct}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CRM AI Market Scout Proactive Proposals */}
          {crmSuggestions.length > 0 && (
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4 border-b border-border-primary pb-3">
                <SectionHeader icon={Sparkles} iconClassName="text-purple-400">
                  AI Market Scout: Đề xuất chốt Deal hôm nay
                </SectionHeader>
                <Badge variant="brand" className="text-[10px]">
                  {crmSuggestions.length} Cơ hội ưu tiên
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {crmSuggestions.slice(0, 4).map((sug) => (
                  <div
                    key={sug.suggestionId}
                    className="rounded-2xl border border-border-primary bg-slate-900/60 p-4 space-y-2 hover:border-purple-500/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                            sug.priority === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {sug.priority}
                        </span>
                        <h4 className="text-xs font-black text-white">{sug.customerName}</h4>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 font-mono">
                        Xác suất chốt: {sug.conversionProbabilityPct}%
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-purple-300">{sug.recommendedAction}</p>
                    <p className="text-[10px] text-slate-400 italic">"{sug.pitchAngle}"</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 3 Core Product Lines & AI Engine Status Card */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* 1. Software Product Line */}
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/40 via-slate-900/60 to-slate-950 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-cyan-500/20 p-2 text-cyan-300 border border-cyan-500/30">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-cyan-400">Trụ Cột 1</span>
                    <h4 className="text-xs font-black text-white">Phần Mềm &amp; SaaS</h4>
                  </div>
                </div>
                <Badge variant="brand" className="text-[9px]">100% Xanh</Badge>
              </div>
              <p className="text-[11px] text-slate-300">
                Kế toán VAS 200/133, AI Router tự thích ứng, Self-Healing Code Robot v2 có duyệt 1-click.
              </p>
              <div className="flex items-center justify-between text-[10px] text-text-tertiary pt-1 border-t border-border-secondary">
                <span>Free Tier + Ollama $0</span>
                <span className="font-bold text-emerald-400">CI Doctor Active</span>
              </div>
            </div>

            {/* 2. Game Studio Pipeline */}
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-slate-950 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-indigo-500/20 p-2 text-indigo-300 border border-indigo-500/30">
                    <Gamepad2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-400">Trụ Cột 2</span>
                    <h4 className="text-xs font-black text-white">Xưởng Game AI 5-in-1</h4>
                  </div>
                </div>
                <Badge variant="brand" className="text-[9px]">5 Giai đoạn</Badge>
              </div>
              <p className="text-[11px] text-slate-300">
                Concept Art, Sprite Spec, SFX Synthesizer (WebAudio), Dialogue &amp; Lore NPC, Cân bằng chỉ số RPG.
              </p>
              <div className="flex items-center justify-between text-[10px] text-text-tertiary pt-1 border-t border-border-secondary">
                <span>Asset Registry</span>
                <span className="font-bold text-indigo-300">Approval Gate</span>
              </div>
            </div>

            {/* 3. Video Studio Pipeline */}
            <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-950/40 via-slate-900/60 to-slate-950 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-violet-500/20 p-2 text-violet-300 border border-violet-500/30">
                    <Film className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-violet-400">Trụ Cột 3</span>
                    <h4 className="text-xs font-black text-white">Studio Video Đa Kênh</h4>
                  </div>
                </div>
                <Badge variant="brand" className="text-[9px]">TikTok / Shorts</Badge>
              </div>
              <p className="text-[11px] text-slate-300">
                Kịch bản từng giây, Voiceover TTS Cues, DaVinci/CapCut Edit Brief export &amp; Thumbnail SEO package.
              </p>
              <div className="flex items-center justify-between text-[10px] text-text-tertiary pt-1 border-t border-border-secondary">
                <span>Hybrid Render</span>
                <span className="font-bold text-violet-300">Viral Hook Ready</span>
              </div>
            </div>
          </div>

          {/* Enterprise Decision & Ontology Graph */}
          <DecisionImpactGraph />

          {/* Main Grid: Interactive Decision Queue & Strategic Priorities */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Interactive Decision Queue */}
            <Card padding="lg" className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-border-primary pb-3">
                  <SectionHeader icon={AlertTriangle} iconClassName="text-warning">
                    Hàng đợi Quyết định Vận hành (Interactive Queue)
                  </SectionHeader>
                  <Badge variant="warning">
                    {COMMAND_CENTER_DECISION_QUEUE.filter((item) => decisionsState[item.decision] !== 'approved').length} mục cần chốt
                  </Badge>
                </div>

                <div className="space-y-3">
                  {COMMAND_CENTER_DECISION_QUEUE.map((item) => {
                    const status = decisionsState[item.decision] || 'pending';
                    return (
                      <div
                        key={item.decision}
                        className={`rounded-2xl border p-4 transition-all ${
                          status === 'approved'
                            ? 'bg-emerald-950/20 border-emerald-500/30 opacity-80'
                            : status === 'rejected'
                            ? 'bg-rose-950/20 border-rose-500/30 opacity-70'
                            : 'bg-bg-elevated border-border-primary hover:border-border-secondary'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-xs font-bold text-text-primary">{item.decision}</h3>
                          <Badge
                            variant={
                              status === 'approved'
                                ? 'success'
                                : status === 'rejected'
                                ? 'error'
                                : 'warning'
                            }
                            className="text-[10px]"
                          >
                            {status === 'approved' ? '✓ Đã chốt' : status === 'rejected' ? '✗ Từ chối' : 'Chờ Founder'}
                          </Badge>
                        </div>

                        <p className="mt-2 text-xs font-semibold leading-5 text-text-secondary">{item.why}</p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border-primary/50 pt-2.5">
                          <span className="text-[10px] font-bold text-text-muted">
                            Rủi ro: <span className="text-warning">{item.risk}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {status !== 'approved' ? (
                              <button
                                type="button"
                                onClick={() => handleDecisionAction(item.decision, 'approved')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                ✓ Duyệt ngay
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDecisionAction(item.decision, 'rejected')}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Đổi quyết định
                              </button>
                            )}

                            {status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleDecisionAction(item.decision, 'rejected')}
                                className="px-2.5 py-1 bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                ✗ Bỏ qua
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Active Strategic Priorities */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4 border-b border-border-primary pb-3">
                <SectionHeader icon={ClipboardList} iconClassName="text-brand">
                  Ưu tiên điều hành hôm nay
                </SectionHeader>
                <Badge variant="brand">Active Strategy</Badge>
              </div>

              <div className="space-y-3">
                {COMMAND_CENTER_TODAY_PRIORITIES.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border-primary bg-bg-elevated p-4 hover:border-border-secondary transition">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="brand">{item.lane}</Badge>
                          <span className="text-[9px] font-bold uppercase text-text-muted">
                            <Calendar className="inline-block w-3 h-3 mr-1" />{item.due}
                          </span>
                        </div>
                        <h3 className="mt-2 text-xs font-bold text-text-primary">{item.title}</h3>
                        <p className="mt-1.5 text-xs font-semibold leading-5 text-text-secondary">{item.decision}</p>
                      </div>
                      <div className="shrink-0 rounded-xl border border-border-primary bg-bg-surface px-3 py-1.5 text-[11px] font-bold text-text-secondary text-center border-l-4 border-l-brand">
                        Owner: {item.owner}
                      </div>
                    </div>
                    <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      Tiêu chí: {item.successMetric}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* MODE: DUYỆT QUYẾT ĐỊNH (HITL APPROVAL INBOX) */}
      {viewMode === 'inbox' && (
        <div className="space-y-6 animate-fade-in">
          <HITLApprovalInboxPanel />
        </div>
      )}

      {/* MODE: UNIFIED ACTIVITY STREAM (PULSE) */}
      {viewMode === 'activity_stream' && (
        <div className="space-y-6 animate-fade-in">
          <UnifiedActivityStreamPanel />
        </div>
      )}

      {/* MODE: COMPANY OPERATING CALENDAR */}
      {viewMode === 'calendar' && (
        <div className="space-y-6 animate-fade-in">
          <CompanyCalendarPanel />
        </div>
      )}

      {/* MODE: 360-DEGREE DEPARTMENT HEALTH */}
      {viewMode === 'dept_health' && (
        <div className="space-y-6 animate-fade-in">
          <DepartmentHealthPanel />
        </div>
      )}

      {/* MODE: NEURAL TOPOLOGY OS STATE MAP */}
      {viewMode === 'topology' && (
        <div className="space-y-6 animate-fade-in">
          <SystemOSStateMap />
        </div>
      )}

      {/* MODE 2: HỌP HỘI ĐỒNG QUẢN TRỊ AI (AI EXECUTIVE BOARDROOM) */}
      {viewMode === 'boardroom' && (
        <div className="space-y-6 animate-fade-in">
          <ExecutiveBoardroomPanel />
        </div>
      )}

      {/* MODE 3: DÒNG TIỀN & RUNWAY (FINANCIAL RUNWAY FOCUS) */}
      {viewMode === 'finance' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Financial Stat Pills */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card padding="md" className="flex items-center justify-between">
              <div>
                <Flame className="mb-2 h-5 w-5 text-emerald-400" />
                <p className="text-[9px] font-bold uppercase text-text-muted">Financial Runway</p>
                <p className="fin-num mt-1 text-2xl font-black text-emerald-400 font-mono">{formatNumberVN(dashboard.runwayMonths, 1)} Tháng</p>
                <p className="text-[9px] font-semibold text-text-muted mt-1 font-mono">Burn rate ~{formatMoneyVN(dashboard.monthlyBurnRate, 'đ/tháng')}</p>
              </div>
              <Badge variant="success">An toàn</Badge>
            </Card>

            <Card padding="md" className="flex items-center justify-between">
              <div>
                <WalletCards className="mb-2 h-5 w-5 text-indigo-400" />
                <p className="text-[9px] font-bold uppercase text-text-muted">Ngân sách còn lại</p>
                <p className="fin-num mt-1 text-xl font-bold text-text-primary">{money(dashboard.remainingBudget)} đ</p>
              </div>
              <Badge variant="brand">Khả dụng</Badge>
            </Card>

            <Card padding="md" className="flex items-center justify-between">
              <div>
                <TrendingUp className="mb-2 h-5 w-5 text-cyan-400" />
                <p className="text-[9px] font-bold uppercase text-text-muted">Tỷ lệ Hoàn ứng</p>
                <p className="fin-num mt-1 text-xl font-bold text-text-primary">{dashboard.advanceRatio}%</p>
                <p className="text-[9px] font-semibold text-text-muted mt-1">Treo: {money(dashboard.openAdvance)} đ</p>
              </div>
              <Badge variant="brand">Đạt 2/3</Badge>
            </Card>

            <Card padding="md" className="flex items-center justify-between">
              <div>
                <FileText className="mb-2 h-5 w-5 text-amber-400" />
                <p className="text-[9px] font-bold uppercase text-text-muted">Tỷ lệ hồ sơ thiếu</p>
                <p className="fin-num mt-1 text-xl font-bold text-text-primary">{dashboard.missingDocRatio}%</p>
                <p className="text-[9px] font-semibold text-text-muted mt-1">Đang thiếu 14 chứng từ</p>
              </div>
              <Badge variant="warning">Cần xử lý</Badge>
            </Card>
          </div>

          {/* AI Capacity Planner & Token Budget Forecast */}
          {capacityForecast && (
            <Card padding="lg" className="border-indigo-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-primary pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-white">Dự Báo Ngân Sách & Năng Lực AI (Capacity Planner)</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${
                          capacityForecast.riskLevel === 'SAFE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : capacityForecast.riskLevel === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {capacityForecast.riskLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Burn Rate: <strong className="text-white">${capacityForecast.dailyBurnRateUsd}/ngày</strong> | Dự kiến cuối tháng: <strong className="text-indigo-300">${capacityForecast.projectedMonthEndSpendUsd}</strong> / Cap: ${capacityForecast.monthlyCapUsd}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-black text-indigo-300">
                    ⏳ Còn ~{capacityForecast.estimatedDaysUntilCap} ngày ngân sách
                  </span>
                </div>
              </div>

              {capacityForecast.recommendations?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">💡 Gợi Ý Tối Ưu Chi Phí Từ AI CFO:</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {capacityForecast.recommendations.map((tip: any) => (
                      <div key={tip.tipId} className="rounded-xl border border-border-primary bg-slate-900/90 p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-black text-white">{tip.title}</h5>
                          <span className="text-[9px] font-bold text-emerald-400">Tiết kiệm ~${tip.potentialSavingsUsd}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{tip.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* SVG Cashflow Chart */}
          <Card padding="lg" className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <SectionHeader icon={BarChart3} iconClassName="text-success">
                  Mô phỏng Luồng tiền & Doanh thu 6 Tháng
                </SectionHeader>
                <p className="text-[11px] text-text-muted font-bold">Thử nghiệm các quý để vẽ lại biểu đồ luồng tiền giả lập (Di chuột xem số liệu chi tiết).</p>
              </div>
              <div className="flex gap-1 border border-border-primary bg-bg-elevated p-1 rounded-xl">
                {(['all', 'q1', 'q2'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuarter(q)}
                    className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase transition cursor-pointer ${
                      quarter === q ? 'bg-success text-bg-primary font-black' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {q === 'all' ? '6 Tháng' : q.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Canvas Chart */}
            <div className="relative rounded-2xl bg-bg-elevated border border-border-primary p-4 h-64 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 600 180">
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="40" y1="20" x2="580" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
                <line x1="40" y1="70" x2="580" y2="70" stroke="#1e293b" strokeDasharray="3,3" />
                <line x1="40" y1="120" x2="580" y2="120" stroke="#1e293b" strokeDasharray="3,3" />
                <line x1="40" y1="160" x2="580" y2="160" stroke="#334155" />

                {/* Draw Area Fills */}
                <path
                  d={`${chartData.revenue.map((val, idx) => {
                    const x = 50 + idx * (500 / (chartData.revenue.length - 1 || 1));
                    const y = 160 - (val / 300) * 130;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')} L ${50 + (chartData.revenue.length - 1) * (500 / (chartData.revenue.length - 1 || 1))} 160 L 50 160 Z`}
                  fill="url(#revGrad)"
                />

                <path
                  d={`${chartData.cashflow.map((val, idx) => {
                    const x = 50 + idx * (500 / (chartData.cashflow.length - 1 || 1));
                    const y = 160 - (val / 300) * 130;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')} L ${50 + (chartData.cashflow.length - 1) * (500 / (chartData.cashflow.length - 1 || 1))} 160 L 50 160 Z`}
                  fill="url(#cashGrad)"
                />

                {/* Draw Revenue Line (Purple) */}
                <path
                  d={chartData.revenue.map((val, idx) => {
                    const x = 50 + idx * (500 / (chartData.revenue.length - 1 || 1));
                    const y = 160 - (val / 300) * 130;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />

                {/* Draw Cashflow Line (Green) */}
                <path
                  d={chartData.cashflow.map((val, idx) => {
                    const x = 50 + idx * (500 / (chartData.cashflow.length - 1 || 1));
                    const y = 160 - (val / 300) * 130;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />

                {/* Nodes & Interactive Tooltips */}
                {chartData.revenue.map((val, idx) => {
                  const x = 50 + idx * (500 / (chartData.revenue.length - 1 || 1));
                  const yRev = 160 - (val / 300) * 130;
                  const yCash = 160 - (chartData.cashflow[idx] / 300) * 130;
                  const cashVal = chartData.cashflow[idx];
                  return (
                    <g key={idx} className="group cursor-pointer">
                      <line x1={x} y1="20" x2={x} y2="160" stroke="#334155" strokeDasharray="2,2" opacity="0.4" />
                      <circle cx={x} cy={yRev} r="5" fill="#a855f7" stroke="#09090b" strokeWidth="2" className="transition-all group-hover:r-7" />
                      <circle cx={x} cy={yCash} r="5" fill="#10b981" stroke="#09090b" strokeWidth="2" className="transition-all group-hover:r-7" />
                      <text x={x} y={yRev - 10} fill="#c084fc" fontSize="9" fontWeight="bold" textAnchor="middle">
                        {val}M
                      </text>
                      <text x={x} y={yCash + 16} fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">
                        {cashVal}M
                      </text>
                      <text x={x} y="175" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
                        {chartData.months[idx]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-2 right-4 flex gap-3 text-[9px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1 text-accent-light">
                  <span className="w-2.5 h-2.5 bg-brand rounded-full inline-block" /> Doanh thu (M VNĐ)
                </span>
                <span className="flex items-center gap-1 text-success">
                  <span className="w-2.5 h-2.5 bg-success rounded-full inline-block" /> Thực thu (M VNĐ)
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODE 3: AGENT AI & HỆ THỐNG (AI WORKFORCE & SYSTEM HEALTH FOCUS) */}
      {viewMode === 'ai_ops' && (
        <div className="space-y-6 animate-fade-in">
          {/* AI Workforce Live Operations Board & Shift Status */}
          {liveBoard && (
            <Card padding="lg" className="border-indigo-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-primary pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-white">Bảng Mạch Vận Hành AI Trực Tuyến (Live Operations Board)</h3>
                      <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[9px] font-black text-indigo-300 border border-indigo-500/30">
                        {liveBoard.activeShift.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Khung giờ: <strong className="text-white">{liveBoard.activeShift.timeRange}</strong> | Trưởng ca: <strong className="text-indigo-300">{liveBoard.activeShift.leaderRoleId}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-400">
                    ● {liveBoard.activeCount} Đang Hoạt Động
                  </span>
                  <span className="rounded-xl border border-border-primary bg-slate-900 px-3 py-1 text-[10px] font-bold text-slate-400">
                    {liveBoard.totalEmployeesCount} Nhân Sự AI
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {liveBoard.employees.map((emp: any) => (
                  <div
                    key={emp.roleId}
                    className="rounded-2xl border border-border-primary bg-slate-900/80 p-3.5 space-y-2 hover:border-indigo-500/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white">{emp.roleName}</h4>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                          emp.status === 'IN_SHIFT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : emp.status === 'QUARANTINED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{emp.currentAction}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-border-secondary">
                      <span>Cấp quyền: <strong className="text-indigo-300">{emp.authorityLevel}</strong></span>
                      <span>✓ {emp.tasksCompletedToday} tasks</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Master System Health Dashboard Component */}
          <MasterSystemHealthDashboard />

          {/* Cloud Hybrid Workflow Status */}
          <CloudHybridWorkflowStatusPanel />

          {/* Assistant Daemon & Live Audit Stream */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* System Runtime Cards */}
            <Card padding="lg" className="space-y-4">
              <SectionHeader icon={ServerCog} iconClassName="text-brand">
                Assistant Daemon Runtime
              </SectionHeader>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl border border-border-primary bg-bg-elevated flex justify-between items-center">
                  <span className="text-text-muted font-bold">Assistant Daemon</span>
                  <Badge variant={dailySnapshot?.daemonOk ? 'success' : 'warning'}>
                    {dailySnapshot?.daemonOk ? 'Online' : 'Needs check'}
                  </Badge>
                </div>

                <div className="p-3 rounded-xl border border-border-primary bg-bg-elevated flex justify-between items-center">
                  <span className="text-text-muted font-bold">Agent Active Runs</span>
                  <span className="font-bold text-text-primary">{dailySnapshot?.activeRuns || 0}</span>
                </div>

                <div className="p-3 rounded-xl border border-border-primary bg-bg-elevated flex justify-between items-center">
                  <span className="text-text-muted font-bold">Waiting Approvals</span>
                  <span className="font-bold text-warning">{dailySnapshot?.waitingApproval || 0}</span>
                </div>

                <div className="p-3 rounded-xl border border-border-primary bg-bg-elevated flex justify-between items-center">
                  <span className="text-text-muted font-bold">Docker Sandbox</span>
                  <Badge variant={dailySnapshot?.dockerOk ? 'success' : 'warning'}>
                    {dailySnapshot?.dockerOk ? 'OK' : 'Check'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Real-time Audit Stream */}
            <Card padding="lg" className="lg:col-span-2 flex flex-col h-full">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-border-primary pb-3">
                <SectionHeader icon={Activity} iconClassName="text-accent-tertiary animate-pulse">
                  Giám sát Robot AI (Live Audit Stream)
                </SectionHeader>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                </span>
              </div>

              <div className="flex-1 rounded-2xl bg-bg-elevated border border-border-primary p-3 h-[320px] overflow-y-auto space-y-2">
                {!dailySnapshot ? (
                  <div className="text-center text-text-muted py-6 text-xs font-semibold animate-pulse">
                    Đang kết nối Assistant Daemon...
                  </div>
                ) : dailySnapshot.recentAudit.length === 0 ? (
                  <div className="text-center text-text-muted py-6 text-xs font-semibold">
                    Hệ thống chưa có Audit Log nào gần đây.
                  </div>
                ) : (
                  dailySnapshot.recentAudit.map((log) => (
                    <div key={log.id} className="text-xs p-2.5 rounded-xl border border-border-primary bg-bg-surface space-y-1 hover:border-border-secondary transition">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="flex items-center gap-1.5 text-accent-light uppercase">
                          <Cpu className="w-3.5 h-3.5 text-accent-tertiary" />
                          {log.actor} - {log.workspace}
                        </span>
                        <span className="text-text-muted">{new Date(log.createdAt).toLocaleTimeString('vi-VN')}</span>
                      </div>
                      <p className="text-text-secondary font-semibold leading-5 pl-5">{log.summary}</p>
                      <div className="pl-5 flex justify-between items-center mt-1">
                        <span className="text-[9px] text-text-muted font-mono uppercase tracking-wider">{log.action}</span>
                        <Badge variant={log.status === 'executed' || log.status === 'approved' ? 'success' : log.status === 'failed' || log.status === 'rejected' ? 'error' : 'info'}>
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* MODE 4: RỦI RO & BÁO CÁO (RISK BOARD & KPI FORMULAS FOCUS) */}
      {viewMode === 'risk_kpi' && (
        <div className="space-y-6 animate-fade-in">
          {/* Risk Board */}
          <Card padding="lg">
            <SectionHeader icon={ShieldCheck} iconClassName="text-success" className="mb-4">
              Bảng theo dõi rủi ro (Executive Risk Board)
            </SectionHeader>
            <div className="grid gap-4 md:grid-cols-3">
              {COMMAND_CENTER_ALERTS.map((alert) => (
                <div key={alert.title} className="rounded-2xl border border-border-primary bg-bg-elevated p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xs font-bold text-text-primary">{alert.title}</h3>
                      <Badge variant={alert.level === 'CRITICAL' ? 'error' : 'warning'}>{alert.level}</Badge>
                    </div>
                    <p className="mt-2 text-[10px] font-bold text-text-muted">Owner: {alert.owner}</p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-text-secondary">{alert.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* KPI Formulas */}
          <Card padding="lg">
            <SectionHeader icon={CheckCircle2} iconClassName="text-brand" className="mb-4">
              Mô hình KPI cốt lõi Doanh nghiệp
            </SectionHeader>
            <div className="grid gap-4 md:grid-cols-2">
              {COMMAND_CENTER_KPIS.map((item) => (
                <div key={item.name} className="rounded-2xl border border-border-secondary bg-bg-elevated p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-xs font-bold text-text-primary">{item.name}</h3>
                      <span className="rounded bg-bg-surface border border-border-primary px-1.5 py-0.5 text-[9px] font-bold text-success">{item.status}</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-text-muted leading-5">{item.detail}</p>
                  </div>
                  <code className="mt-3 block rounded-lg bg-black/40 p-2.5 text-[9px] font-mono text-accent-light whitespace-pre-wrap">{item.formula}</code>
                </div>
              ))}
            </div>
          </Card>

          {/* Report Templates */}
          <Card padding="lg">
            <SectionHeader icon={FileText} iconClassName="text-info" className="mb-4">
              Mẫu báo cáo nhanh dành cho CEO
            </SectionHeader>
            <div className="grid gap-4 md:grid-cols-3">
              {COMMAND_CENTER_REPORT_TEMPLATES.map((template) => (
                <div key={template.title} className="rounded-2xl border border-border-primary bg-bg-elevated p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-text-primary">{template.title}</h3>
                    <p className="mt-2 text-xs font-semibold leading-5 text-text-secondary line-clamp-3">{template.body}</p>
                  </div>
                  <button
                    onClick={() => copyText(template.title, template.body)}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-secondary px-3 py-1.5 text-[10px] font-bold text-text-secondary hover:border-brand hover:text-text-primary cursor-pointer transition"
                  >
                    <Copy className="h-3 w-3" />
                    {copied === template.title ? 'Đã copy' : 'Copy mẫu báo cáo'}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* MODE 6: ENTERPRISE AI & VOICE SUITE */}
      {viewMode === 'enterprise' && (
        <div className="space-y-6 animate-fade-in">
          <EnterpriseControlCenterPanel />
        </div>
      )}

      {/* Executive Voice Earphone Mode Hands-Free Modal */}
      <ExecutiveEarphoneModeModal
        isOpen={isEarphoneOpen}
        onClose={() => setIsEarphoneOpen(false)}
      />
    </div>
  );
}
