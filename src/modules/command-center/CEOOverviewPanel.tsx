import React, { useMemo, useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, ClipboardList, Copy, FileText, Gauge, ShieldCheck, WalletCards, Activity, Calendar, Sparkles, TrendingUp, Cpu, Check } from 'lucide-react';
import {
  COMMAND_CENTER_ALERTS,
  COMMAND_CENTER_DECISION_QUEUE,
  COMMAND_CENTER_KPIS,
  COMMAND_CENTER_OPERATING_RHYTHM,
  COMMAND_CENTER_REPORT_TEMPLATES,
  COMMAND_CENTER_TODAY_PRIORITIES,
  COMMAND_CENTER_WORKFLOWS
} from '../../data/commandCenterKnowledge';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

type LogItem = {
  id: string;
  time: string;
  agent: string;
  action: string;
  status: 'info' | 'success' | 'warn';
};

const AGENT_MOCK_ACTIONS = [
  { agent: 'AI Chief of Staff', action: 'Rà soát độ lệch ngân sách quý 2 và cảnh báo dòng tiền.', status: 'info' as const },
  { agent: 'AI Developer', action: 'Hoàn thành Patch #104 fix lỗi WASM SQLite sandbox, chuẩn bị merge.', status: 'success' as const },
  { agent: 'AI Marketer', action: 'Đang giả lập 1,200 phản hồi từ khảo sát người dùng về game kế toán.', status: 'info' as const },
  { agent: 'AI Accountant', action: 'Phát hiện 2 hóa đơn tiếp khách vượt định mức chi phí 15% trong COSO.', status: 'warn' as const },
  { agent: 'AI Auditor', action: 'Xác nhận toàn bộ build CI/CD trên GitHub đã chuyển màu xanh.', status: 'success' as const },
  { agent: 'AI Sales Agent', action: 'Đang huấn luyện kịch bản đàm phán với khách hàng B2B lớn mới.', status: 'info' as const },
];

export default function CEOOverviewPanel() {
  const [copied, setCopied] = useState<string | null>(null);
  const [quarter, setQuarter] = useState<'all' | 'q1' | 'q2'>('all');
  const [logs, setLogs] = useState<LogItem[]>([]);

  // Simulation: Append new AI logs over time
  useEffect(() => {
    // Initial logs
    const initialLogs: LogItem[] = Array.from({ length: 4 }).map((_, idx) => {
      const item = AGENT_MOCK_ACTIONS[idx % AGENT_MOCK_ACTIONS.length];
      const time = new Date(Date.now() - (4 - idx) * 60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        id: `log-${idx}-${Date.now()}`,
        time,
        agent: item.agent,
        action: item.action,
        status: item.status
      };
    });
    setLogs(initialLogs);

    const interval = setInterval(() => {
      const randItem = AGENT_MOCK_ACTIONS[Math.floor(Math.random() * AGENT_MOCK_ACTIONS.length)];
      const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLog: LogItem = {
        id: `log-${Date.now()}`,
        time: nowStr,
        agent: randItem.agent,
        action: randItem.action,
        status: randItem.status
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 15)]);
    }, 4500);

    return () => clearInterval(interval);
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
      <section className="rounded-3xl border border-purple-500/25 bg-slate-950/70 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between relative z-10">
          <div className="max-w-4xl text-left">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-purple-300">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              Founder Command Room
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              CEO Strategic Control Center
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Trung tâm điều khiển chiến lược tích hợp. Nơi Founder rà soát chỉ số sức khỏe tài chính, dòng tiền giả lập, duyệt các quyết định vận hành và giám sát hoạt động thời gian thực của đội ngũ AI Agents.
            </p>
          </div>

          <button
            onClick={() => copyText('bossBrief', bossBrief)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 border border-purple-400 hover:bg-purple-600 px-5 py-3.5 text-xs font-black text-white shadow-lg shadow-purple-950/40 cursor-pointer transition shrink-0"
          >
            {copied === 'bossBrief' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === 'bossBrief' ? 'Đã copy báo cáo' : 'Copy báo cáo nhanh'}
          </button>
        </div>
      </section>

      {/* Main Grid: Priorities & Risk + AI Logs */}
      <section className="grid gap-5 xl:grid-cols-3">
        {/* CEO Priorities */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 xl:col-span-2 text-left">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ClipboardList className="h-4 w-4 text-purple-400" />
              Ưu tiên điều hành hôm nay
            </h2>
            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[10px] font-black uppercase text-purple-300">
              Active Strategy
            </span>
          </div>
          <div className="space-y-3">
            {COMMAND_CENTER_TODAY_PRIORITIES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 hover:border-slate-700 transition">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-purple-300">
                        {item.lane}
                      </span>
                      <span className="text-[9px] font-black uppercase text-slate-500"><Calendar className="inline-block w-3 h-3 mr-1" />{item.due}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-black text-white">{item.title}</h3>
                    <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.decision}</p>
                  </div>
                  <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-bold text-slate-300 md:max-w-[180px] text-center border-l-4 border-l-purple-400">
                    Owner: {item.owner}
                  </div>
                </div>
                <p className="mt-3 flex items-start gap-2 text-xs font-semibold leading-6 text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  Tiêu chí: {item.successMetric}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time AI Agent Activity Logs */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col h-full text-left">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Activity className="h-4 w-4 text-violet-400 animate-pulse" />
              Giám sát Robot AI (Live)
            </h2>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex-1 rounded-2xl bg-slate-950/70 border border-slate-850 p-3 h-[440px] overflow-y-auto space-y-2.5 scrollbar-thin">
            {logs.map((log) => (
              <div key={log.id} className="text-xs p-2.5 rounded-xl border border-slate-900 bg-slate-900/30 space-y-1 hover:border-slate-800 transition">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="flex items-center gap-1.5 text-violet-300">
                    <Cpu className="w-3.5 h-3.5 text-violet-400" />
                    {log.agent}
                  </span>
                  <span className="text-slate-500">{log.time}</span>
                </div>
                <p className="text-slate-300 font-semibold leading-5 pl-5">{log.action}</p>
                <div className="pl-5 flex justify-end">
                  <span className={`rounded-full px-2 py-0.2 text-[8px] font-black uppercase ${
                    log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : log.status === 'warn' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cashflow SVG & Financial Metric section */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* SVG Cashflow Simulator */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2 text-left space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                Mô phỏng Luồng tiền & Doanh thu
              </h2>
              <p className="text-[11px] text-slate-500 font-bold">Thử nghiệm các quý để vẽ lại biểu đồ luồng tiền giả lập.</p>
            </div>
            <div className="flex gap-1 border border-slate-800 bg-slate-950 p-1 rounded-xl">
              {(['all', 'q1', 'q2'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuarter(q)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase transition cursor-pointer ${
                    quarter === q ? 'bg-emerald-400 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {q === 'all' ? '6 Tháng' : q.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Canvas Chart */}
          <div className="relative rounded-2xl bg-slate-950/60 border border-slate-850 p-4 h-56 flex items-center justify-center">
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
            <div className="absolute bottom-2 right-4 flex gap-3 text-[9px] font-black uppercase tracking-wider">
              <span className="flex items-center gap-1 text-purple-300">
                <span className="w-2.5 h-2.5 bg-purple-500 rounded-full inline-block" /> Doanh thu (M)
              </span>
              <span className="flex items-center gap-1 text-emerald-300">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" /> Thực thu (M)
              </span>
            </div>
          </div>
        </div>

        {/* 4 Financial KPIs */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between text-left">
            <div>
              <WalletCards className="mb-2 h-5 w-5 text-emerald-300" />
              <p className="text-[9px] font-black uppercase text-slate-500">Ngân sách còn lại</p>
              <p className="fin-num mt-1 text-lg font-black text-white">{money(dashboard.remainingBudget)} đ</p>
            </div>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">An toàn</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between text-left">
            <div>
              <TrendingUp className="mb-2 h-5 w-5 text-purple-300" />
              <p className="text-[9px] font-black uppercase text-slate-500">Tỷ lệ Hoàn ứng</p>
              <p className="fin-num mt-1 text-lg font-black text-white">{dashboard.advanceRatio}%</p>
              <p className="text-[9px] font-bold text-slate-500 mt-1">Cần đòi: {money(dashboard.openAdvance)} đ</p>
            </div>
            <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Đạt 2/3</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between text-left">
            <div>
              <FileText className="mb-2 h-5 w-5 text-amber-300" />
              <p className="text-[9px] font-black uppercase text-slate-500">Tỷ lệ hồ sơ thiếu</p>
              <p className="fin-num mt-1 text-lg font-black text-white">{dashboard.missingDocRatio}%</p>
              <p className="text-[9px] font-bold text-slate-500 mt-1">Đang thiếu 14 chứng từ</p>
            </div>
            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Cần xử lý</span>
          </div>
        </div>
      </section>

      {/* Alerts and Decision Queue */}
      <section className="grid gap-5 lg:grid-cols-2 text-left">
        {/* Decision Queue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            Hàng đợi quyết định vận hành
          </h2>
          <div className="space-y-3">
            {COMMAND_CENTER_DECISION_QUEUE.map((item) => (
              <div key={item.decision} className="rounded-xl border border-amber-500/20 bg-slate-950/70 p-4">
                <h3 className="text-xs font-black text-white">{item.decision}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{item.why}</p>
                <p className="mt-2 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 inline-block rounded">
                  Hành động mặc định: {item.defaultAction}
                </p>
                <p className="mt-1 text-xs font-semibold leading-6 text-amber-200">Mức rủi ro: {item.risk}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Board */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Bảng theo dõi rủi ro (Risk Board)
          </h2>
          <div className="space-y-3">
            {COMMAND_CENTER_ALERTS.map((alert) => (
              <div key={alert.title} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-black text-white">{alert.title}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black border ${
                    alert.level === 'CRITICAL' ? 'border-rose-400/30 text-rose-300 bg-rose-500/10' : 'border-amber-400/30 text-amber-300 bg-amber-500/10'
                  }`}>{alert.level}</span>
                </div>
                <p className="mt-2 text-[10px] font-bold text-slate-500">Chịu trách nhiệm: {alert.owner}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{alert.action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KPI formulas */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
          <CheckCircle2 className="h-4 w-4 text-purple-400" />
          Mô hình KPI cốt lõi
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {COMMAND_CENTER_KPIS.map((item) => (
            <div key={item.name} className="rounded-xl border border-slate-850 bg-slate-950/50 p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-xs font-black text-white">{item.name}</h3>
                  <span className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] font-black text-emerald-400">{item.status}</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-400 leading-5">{item.detail}</p>
              </div>
              <code className="mt-3 block rounded-lg bg-black/40 p-2.5 text-[9px] font-mono text-purple-300 whitespace-pre-wrap">{item.formula}</code>
            </div>
          ))}
        </div>
      </section>

      {/* Templates & Workflows */}
      <section className="grid gap-5 lg:grid-cols-5 text-left">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 lg:col-span-3 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <ClipboardList className="h-4 w-4 text-violet-400" />
            Luồng xử lý từ Phát sinh đến Báo cáo
          </h2>
          <div className="space-y-3">
            {COMMAND_CENTER_WORKFLOWS.map((step) => (
              <div key={step.step} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                <div>
                  <h3 className="text-xs font-black text-white">{step.step}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 lg:col-span-2 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <FileText className="h-4 w-4 text-cyan-300" />
            Mẫu báo cáo nhanh
          </h2>
          <div className="space-y-3">
            {COMMAND_CENTER_REPORT_TEMPLATES.map((template) => (
              <div key={template.title} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <h3 className="text-xs font-black text-white">{template.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-400 line-clamp-3">{template.body}</p>
                <button
                  onClick={() => copyText(template.title, template.body)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-[10px] font-black text-slate-300 hover:border-emerald-400 hover:text-white cursor-pointer transition"
                >
                  <Copy className="h-3 w-3" />
                  {copied === template.title ? 'Đã copy' : 'Copy mẫu'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
