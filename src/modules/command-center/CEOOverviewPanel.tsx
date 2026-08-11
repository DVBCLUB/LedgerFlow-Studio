import React, { useMemo, useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, ClipboardList, Copy, FileText, ShieldCheck, WalletCards, Activity, Calendar, Sparkles, TrendingUp, Cpu, Check, RefreshCw, ServerCog } from 'lucide-react';
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
  COMMAND_CENTER_OPERATING_RHYTHM,
  COMMAND_CENTER_REPORT_TEMPLATES,
  COMMAND_CENTER_TODAY_PRIORITIES,
  COMMAND_CENTER_WORKFLOWS
} from '../../data/commandCenterKnowledge';
import MorningExecutiveBriefingCard from './components/MorningExecutiveBriefingCard';
import CloudHybridWorkflowStatusPanel from '../../components/shared/CloudHybridWorkflowStatusPanel';
import MasterSystemHealthDashboard from '../../components/shared/MasterSystemHealthDashboard';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

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

function badgeForRuntime(ok: boolean | null) {
  if (ok === true) return 'success';
  if (ok === false) return 'warning';
  return 'default';
}

export default function CEOOverviewPanel() {
  const [copied, setCopied] = useState<string | null>(null);
  const [quarter, setQuarter] = useState<'all' | 'q1' | 'q2'>('all');
  const [dailySnapshot, setDailySnapshot] = useState<DailyCommandSnapshot | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState('');

  const refreshDailySnapshot = async () => {
    setDailyLoading(true);
    setDailyError('');
    try {
      const [healthResult, runsResult, auditResult, missionsResult, dockerResult] = await Promise.allSettled([
        checkDaemonHealth(),
        fetchAgentRuns(20),
        fetchAuditLogs(8),
        fetchSweAgentMissions(8),
        runSweDockerDoctor(),
      ]);

      const health = healthResult.status === 'fulfilled' ? healthResult.value : null;
      const runs = runsResult.status === 'fulfilled' ? runsResult.value : null;
      const audit = auditResult.status === 'fulfilled' ? auditResult.value : [];
      const missions = missionsResult.status === 'fulfilled' ? missionsResult.value : [];
      const docker = dockerResult.status === 'fulfilled' ? dockerResult.value : null;

      setDailySnapshot({
        daemonOk: Boolean(health?.ok),
        daemonHint: health?.hint || (healthResult.status === 'rejected' ? healthResult.reason?.message || 'Assistant daemon unavailable.' : 'Assistant daemon status unknown.'),
        emergencyStop: Boolean(runs?.emergencyStop),
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

  const dashboard = useMemo(() => {
    const plannedBudget = 8_500_000_000;
    const actualCost = 7_835_000_000;
    const advances = 920_000_000;
    const settled = 662_000_000;
    const missingDocs = 14;
    const totalFiles = 74;

    return {
      plannedBudget,
      actualCost,
      remainingBudget: plannedBudget - actualCost,
      advanceRatio: Math.round((settled / advances) * 100),
      missingDocRatio: Math.round((missingDocs / totalFiles) * 100),
      openAdvance: advances - settled
    };
  }, []);

  // Quarter-based simulation cashflow data for SVG
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

  const bossBrief = `BÁO CÁO NHANH COMMAND CENTER\n\n1. Ngân sách còn lại: ${money(dashboard.remainingBudget)} VNĐ.\n2. Tỷ lệ hoàn ứng: ${dashboard.advanceRatio}%. Số tạm ứng còn treo: ${money(dashboard.openAdvance)} VNĐ.\n3. Tỷ lệ hồ sơ thiếu: ${dashboard.missingDocRatio}%.\n4. Việc cần xử lý: chặn khoản vượt ngân sách, nhắc hoàn ứng, kiểm tra VAT, rà ngoại lệ vận hành cần người duyệt.`;

  return (
    <div className="space-y-6 select-none">
      {/* Header card accented */}
      <section className="rounded-3xl border border-brand/25 bg-bg-surface p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between relative z-10">
          <div className="max-w-4xl text-left">
            <Badge variant="brand" className="mb-3 gap-2 px-3 py-1 text-[11px]">
              <Sparkles className="h-3.5 w-3.5" />
              Founder Command Room
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              CEO Strategic Control Center
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
              Trung tâm điều khiển chiến lược tích hợp. Nơi Founder rà soát chỉ số sức khỏe tài chính, dòng tiền giả lập, duyệt các quyết định vận hành và giám sát hoạt động thời gian thực của đội ngũ AI Agents.
            </p>
          </div>

          <Button
            onClick={() => copyText('bossBrief', bossBrief)}
            variant="primary"
            className="px-5 py-3.5 text-xs shadow-lg shrink-0"
          >
            {copied === 'bossBrief' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === 'bossBrief' ? 'Đã copy báo cáo' : 'Copy báo cáo nhanh'}
          </Button>
        </div>
      </section>

      {/* Executive Morning Briefing */}
      <MorningExecutiveBriefingCard />

      {/* Master System Health Dashboard */}
      <MasterSystemHealthDashboard />

      {/* Cloud Hybrid Workflow Status & API Budget Monitor */}
      <CloudHybridWorkflowStatusPanel />

      <Card padding="lg" className="text-left">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <SectionHeader icon={ServerCog} iconClassName="text-brand">
              Founder Daily Command
            </SectionHeader>
            <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-text-secondary">
              Tóm tắt dữ liệu vận hành thật từ assistant daemon, agent runtime, audit log, Docker Doctor và Autonomous SWE Agent Loop.
            </p>
          </div>
          <Button onClick={() => void refreshDailySnapshot()} disabled={dailyLoading} variant="secondary" size="sm" className="shrink-0 gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${dailyLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        {dailyError && (
          <div className="mt-4 rounded-xl border border-error/20 bg-error-bg p-3 text-xs font-bold text-error">
            {dailyError}
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-border-primary bg-bg-elevated p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Assistant daemon</p>
            <Badge variant={dailySnapshot?.daemonOk ? 'success' : 'warning'} className="mt-2">{dailySnapshot?.daemonOk ? 'Online' : 'Needs check'}</Badge>
            <p className="mt-2 line-clamp-3 text-[11px] font-semibold leading-5 text-text-secondary">{dailySnapshot?.daemonHint || 'Đang tải trạng thái daemon...'}</p>
          </div>
          <div className="rounded-xl border border-border-primary bg-bg-elevated p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Agent runtime</p>
            <p className="mt-2 text-xl font-black text-text-primary">{dailySnapshot?.activeRuns ?? 0}</p>
            <p className="text-[11px] font-semibold text-text-secondary">run đang hoạt động</p>
            <Badge variant={dailySnapshot?.emergencyStop ? 'error' : 'success'} className="mt-2">{dailySnapshot?.emergencyStop ? 'Emergency stop' : 'Ready'}</Badge>
          </div>
          <div className="rounded-xl border border-border-primary bg-bg-elevated p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Chờ duyệt</p>
            <p className="mt-2 text-xl font-black text-warning">{dailySnapshot?.waitingApproval ?? 0}</p>
            <p className="text-[11px] font-semibold text-text-secondary">agent run cần founder quyết định</p>
          </div>
          <div className="rounded-xl border border-border-primary bg-bg-elevated p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">SWE missions</p>
            <p className="mt-2 text-xl font-black text-text-primary">{dailySnapshot?.sweMissions.length ?? 0}</p>
            <p className="text-[11px] font-semibold text-text-secondary">mission gần nhất trong lịch sử</p>
          </div>
          <div className="rounded-xl border border-border-primary bg-bg-elevated p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-text-muted">Docker sandbox</p>
            <Badge variant={badgeForRuntime(dailySnapshot?.dockerOk ?? null)} className="mt-2">
              {dailySnapshot?.dockerOk === true ? 'OK' : dailySnapshot?.dockerOk === false ? 'Check' : 'Unknown'}
            </Badge>
            <p className="mt-2 line-clamp-3 text-[11px] font-semibold leading-5 text-text-secondary">{dailySnapshot?.dockerSummary || 'Docker Doctor chưa có dữ liệu.'}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border-primary bg-bg-elevated p-4">
            <p className="text-xs font-black uppercase tracking-wide text-text-secondary">SWE mission gần nhất</p>
            <div className="mt-3 space-y-2">
              {(dailySnapshot?.sweMissions ?? []).slice(0, 4).map((mission) => (
                <div key={mission.id} className="rounded-lg border border-border-primary bg-bg-surface p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-black text-text-primary">{mission.id}</p>
                    <Badge variant={mission.status === 'completed' ? 'success' : mission.status === 'failed' ? 'error' : mission.status === 'awaiting_human_approval' ? 'warning' : 'info'}>
                      {mission.status}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-text-secondary">{mission.config.goalPrompt}</p>
                </div>
              ))}
              {(!dailySnapshot || dailySnapshot.sweMissions.length === 0) && <p className="text-xs font-semibold text-text-muted">Chưa có mission SWE nào.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border-primary bg-bg-elevated p-4">
            <p className="text-xs font-black uppercase tracking-wide text-text-secondary">Audit log mới</p>
            <div className="mt-3 space-y-2">
              {(dailySnapshot?.recentAudit ?? []).slice(0, 4).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border-primary bg-bg-surface p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-black text-text-primary">{entry.action}</p>
                    <Badge variant={entry.status === 'failed' ? 'error' : entry.status === 'executed' ? 'success' : 'info'}>{entry.status}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-text-secondary">{entry.summary}</p>
                </div>
              ))}
              {(!dailySnapshot || dailySnapshot.recentAudit.length === 0) && <p className="text-xs font-semibold text-text-muted">Chưa có audit log gần đây.</p>}
            </div>
          </div>
        </div>

        {dailySnapshot?.loadedAt && (
          <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-text-muted">
            Cập nhật: {new Date(dailySnapshot.loadedAt).toLocaleString('vi-VN')}
          </p>
        )}
      </Card>

      {/* Main Grid: Priorities & Risk + AI Logs */}
      <section className="grid gap-5 xl:grid-cols-3">
        {/* CEO Priorities */}
        <Card padding="lg" className="xl:col-span-2 text-left">
          <div className="mb-4 flex items-center justify-between gap-3">
            <SectionHeader icon={ClipboardList} iconClassName="text-brand">
              Ưu tiên điều hành hôm nay
            </SectionHeader>
            <Badge variant="brand">Active Strategy</Badge>
          </div>
          <div className="space-y-3">
            {COMMAND_CENTER_TODAY_PRIORITIES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border-primary bg-bg-elevated p-4 hover:border-border-secondary transition">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="brand">{item.lane}</Badge>
                      <span className="text-[9px] font-bold uppercase text-text-muted"><Calendar className="inline-block w-3 h-3 mr-1" />{item.due}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-text-primary">{item.title}</h3>
                    <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{item.decision}</p>
                  </div>
                  <div className="shrink-0 rounded-xl border border-border-primary bg-bg-surface px-3.5 py-2 text-xs font-bold text-text-secondary md:max-w-[180px] text-center border-l-4 border-l-brand">
                    Owner: {item.owner}
                  </div>
                </div>
                <p className="mt-3 flex items-start gap-2 text-xs font-semibold leading-6 text-success">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  Tiêu chí: {item.successMetric}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Real-time AI Agent Activity Logs */}
        <Card padding="lg" className="flex flex-col h-full text-left">
          <div className="mb-4 flex items-center justify-between gap-3">
            <SectionHeader icon={Activity} iconClassName="text-accent-tertiary animate-pulse">
              Giám sát Robot AI (Live)
            </SectionHeader>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
          </div>

          <div className="flex-1 rounded-2xl bg-bg-elevated border border-border-primary p-3 h-[440px] overflow-y-auto space-y-2.5 scrollbar-thin">
            {!dailySnapshot ? (
              <div className="text-center text-text-muted py-6 text-sm font-semibold animate-pulse">
                Đang kết nối Assistant Daemon...
              </div>
            ) : dailySnapshot.recentAudit.length === 0 ? (
              <div className="text-center text-text-muted py-6 text-sm font-semibold">
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
      </section>

      {/* Cashflow SVG & Financial Metric section */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* SVG Cashflow Simulator */}
        <Card padding="lg" className="lg:col-span-2 text-left space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <SectionHeader icon={BarChart3} iconClassName="text-success">
                Mô phỏng Luồng tiền & Doanh thu
              </SectionHeader>
              <p className="text-[11px] text-text-muted font-bold">Thử nghiệm các quý để vẽ lại biểu đồ luồng tiền giả lập.</p>
            </div>
            <div className="flex gap-1 border border-border-primary bg-bg-elevated p-1 rounded-xl">
              {(['all', 'q1', 'q2'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuarter(q)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase transition cursor-pointer ${
                    quarter === q ? 'bg-success text-bg-primary' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {q === 'all' ? '6 Tháng' : q.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Canvas Chart */}
          <div className="relative rounded-2xl bg-bg-elevated border border-border-primary p-4 h-56 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 600 180">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="580" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="40" y1="70" x2="580" y2="70" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="40" y1="120" x2="580" y2="120" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="40" y1="160" x2="580" y2="160" stroke="#334155" />

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

              {/* Nodes and Labels */}
              {chartData.revenue.map((val, idx) => {
                const x = 50 + idx * (500 / (chartData.revenue.length - 1 || 1));
                const yRev = 160 - (val / 300) * 130;
                const yCash = 160 - (chartData.cashflow[idx] / 300) * 130;
                return (
                  <g key={idx}>
                    {/* Revenue Dot */}
                    <circle cx={x} cy={yRev} r="4.5" fill="#a855f7" />
                    {/* Cashflow Dot */}
                    <circle cx={x} cy={yCash} r="4.5" fill="#10b981" />
                    {/* X Axis Labels */}
                    <text x={x} y="175" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">
                      {chartData.months[idx]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Chart Legend */}
            <div className="absolute bottom-2 right-4 flex gap-3 text-[9px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1 text-accent-light">
                <span className="w-2.5 h-2.5 bg-brand rounded-full inline-block" /> Doanh thu (M)
              </span>
              <span className="flex items-center gap-1 text-success">
                <span className="w-2.5 h-2.5 bg-success rounded-full inline-block" /> Thực thu (M)
              </span>
            </div>
          </div>
        </Card>

        {/* 4 Financial KPIs */}
        <div className="space-y-3 flex flex-col justify-between">
          <Card padding="md" className="flex items-center justify-between text-left">
            <div>
              <WalletCards className="mb-2 h-5 w-5 text-success" />
              <p className="text-[9px] font-bold uppercase text-text-muted">Ngân sách còn lại</p>
              <p className="fin-num mt-1 text-lg font-bold text-text-primary">{money(dashboard.remainingBudget)} đ</p>
            </div>
            <Badge variant="success">An toàn</Badge>
          </Card>

          <Card padding="md" className="flex items-center justify-between text-left">
            <div>
              <TrendingUp className="mb-2 h-5 w-5 text-brand" />
              <p className="text-[9px] font-bold uppercase text-text-muted">Tỷ lệ Hoàn ứng</p>
              <p className="fin-num mt-1 text-lg font-bold text-text-primary">{dashboard.advanceRatio}%</p>
              <p className="text-[9px] font-semibold text-text-muted mt-1">Cần đòi: {money(dashboard.openAdvance)} đ</p>
            </div>
            <Badge variant="brand">Đạt 2/3</Badge>
          </Card>

          <Card padding="md" className="flex items-center justify-between text-left">
            <div>
              <FileText className="mb-2 h-5 w-5 text-warning" />
              <p className="text-[9px] font-bold uppercase text-text-muted">Tỷ lệ hồ sơ thiếu</p>
              <p className="fin-num mt-1 text-lg font-bold text-text-primary">{dashboard.missingDocRatio}%</p>
              <p className="text-[9px] font-semibold text-text-muted mt-1">Đang thiếu 14 chứng từ</p>
            </div>
            <Badge variant="warning">Cần xử lý</Badge>
          </Card>
        </div>
      </section>

      {/* Alerts and Decision Queue */}
      <section className="grid gap-5 lg:grid-cols-2 text-left">
        {/* Decision Queue */}
        <Card padding="lg">
          <SectionHeader icon={AlertTriangle} iconClassName="text-warning" className="mb-4 text-warning">
            Hàng đợi quyết định vận hành
          </SectionHeader>
          <div className="space-y-3">
            {COMMAND_CENTER_DECISION_QUEUE.map((item) => (
              <div key={item.decision} className="rounded-xl border border-warning/20 bg-bg-elevated p-4">
                <h3 className="text-xs font-semibold text-text-primary">{item.decision}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-text-secondary">{item.why}</p>
                <Badge variant="success" className="mt-2 inline-flex">
                  Hành động mặc định: {item.defaultAction}
                </Badge>
                <p className="mt-1 text-xs font-semibold leading-6 text-warning">Mức rủi ro: {item.risk}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Risk Board */}
        <Card padding="lg">
          <SectionHeader icon={ShieldCheck} iconClassName="text-success" className="mb-4">
            Bảng theo dõi rủi ro (Risk Board)
          </SectionHeader>
          <div className="space-y-3">
            {COMMAND_CENTER_ALERTS.map((alert) => (
              <div key={alert.title} className="rounded-xl border border-border-primary bg-bg-elevated p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold text-text-primary">{alert.title}</h3>
                  <Badge variant={alert.level === 'CRITICAL' ? 'error' : 'warning'}>{alert.level}</Badge>
                </div>
                <p className="mt-2 text-[10px] font-bold text-text-muted">Chịu trách nhiệm: {alert.owner}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-text-secondary">{alert.action}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* KPI formulas */}
      <Card padding="lg" className="text-left">
        <SectionHeader icon={CheckCircle2} iconClassName="text-brand" className="mb-4">
          Mô hình KPI cốt lõi
        </SectionHeader>
        <div className="grid gap-4 md:grid-cols-2">
          {COMMAND_CENTER_KPIS.map((item) => (
            <div key={item.name} className="rounded-xl border border-border-secondary bg-bg-elevated p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-xs font-semibold text-text-primary">{item.name}</h3>
                  <span className="rounded bg-bg-surface border border-border-primary px-1.5 py-0.5 text-[9px] font-bold text-success">{item.status}</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-text-muted leading-5">{item.detail}</p>
              </div>
              <code className="mt-3 block rounded-lg bg-black/40 p-2.5 text-[9px] font-mono text-accent-light whitespace-pre-wrap">{item.formula}</code>
            </div>
          ))}
        </div>
      </Card>

      {/* Templates & Workflows */}
      <section className="grid gap-5 lg:grid-cols-5 text-left">
        <Card padding="lg" className="lg:col-span-3">
          <SectionHeader icon={ClipboardList} iconClassName="text-accent-tertiary" className="mb-4">
            Luồng xử lý từ Phát sinh đến Báo cáo
          </SectionHeader>
          <div className="space-y-3">
            {COMMAND_CENTER_WORKFLOWS.map((step) => (
              <div key={step.step} className="flex gap-3 rounded-xl border border-border-primary bg-bg-elevated p-4">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-accent-tertiary" />
                <div>
                  <h3 className="text-xs font-semibold text-text-primary">{step.step}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-text-secondary">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg" className="lg:col-span-2">
          <SectionHeader icon={FileText} iconClassName="text-info" className="mb-4">
            Mẫu báo cáo nhanh
          </SectionHeader>
          <div className="space-y-3">
            {COMMAND_CENTER_REPORT_TEMPLATES.map((template) => (
              <div key={template.title} className="rounded-xl border border-border-primary bg-bg-elevated p-4">
                <h3 className="text-xs font-semibold text-text-primary">{template.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-text-secondary line-clamp-3">{template.body}</p>
                <button
                  onClick={() => copyText(template.title, template.body)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border-secondary px-3 py-1.5 text-[10px] font-bold text-text-secondary hover:border-brand hover:text-text-primary cursor-pointer transition"
                >
                  <Copy className="h-3 w-3" />
                  {copied === template.title ? 'Đã copy' : 'Copy mẫu'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
