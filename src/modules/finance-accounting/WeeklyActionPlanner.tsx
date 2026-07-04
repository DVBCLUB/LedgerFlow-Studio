import React, { useMemo, useState } from 'react';

type Interview = { painScore?: number; payScore?: number; evidenceScore?: number };
type Lead = { stage?: string; name?: string; nextAction?: string; persona?: string };
type Decision = { experiment?: string; decision?: string; confidence?: number; nextAction?: string; owner?: string; reviewDate?: string };
type Tool = { monthlyCost?: number; category?: string; decision?: string; name?: string };
type ActionStatus = 'Todo' | 'Doing' | 'Done' | 'Blocked';
type WeeklyAction = { id: string; title: string; source: string; owner: string; dueDate: string; status: ActionStatus; reason: string };

const storageKey = 'ledgerflow-weekly-action-planner-v1';

const readArray = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const avg = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
const toDate = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const buildSuggestedActions = (): WeeklyAction[] => {
  const interviews = readArray<Interview>('ledgerflow-persona-interviews-v1');
  const leads = readArray<Lead>('ledgerflow-distribution-leads-v1');
  const decisions = readArray<Decision>('ledgerflow-experiment-decisions-v1');
  const tools = readArray<Tool>('ledgerflow-tool-budget-ledger-v1');

  const painAvg = avg(interviews.map((item) => Number(item.painScore || 0)));
  const payAvg = avg(interviews.map((item) => Number(item.payScore || 0)));
  const evidenceAvg = avg(interviews.map((item) => Number(item.evidenceScore || 0)));
  const paidLead = leads.find((item) => item.stage === 'Có tín hiệu trả tiền');
  const demoLead = leads.find((item) => item.stage === 'Đã demo');
  const buildDecision = decisions.find((item) => item.decision === 'BUILD');
  const riskyTool = [...tools]
    .filter((item) => ['Review', 'Cancel'].includes(item.decision || ''))
    .sort((a, b) => Number(b.monthlyCost || 0) - Number(a.monthlyCost || 0))[0];

  const actions: WeeklyAction[] = [];

  actions.push({
    id: 'weekly-review',
    title: 'Chốt 1 mục tiêu tuần và ghi rõ tiêu chí thành công',
    source: 'Monthly Review',
    owner: 'Founder',
    dueDate: toDate(1),
    status: 'Todo',
    reason: 'Không để AI build lan man; tuần nào cũng cần một mục tiêu đo được.'
  });

  if (paidLead) {
    actions.push({
      id: 'paid-signal-followup',
      title: `Follow-up lead có tín hiệu trả tiền: ${paidLead.name || paidLead.persona || 'Unnamed lead'}`,
      source: 'Lead Board',
      owner: 'Founder / AI Sales',
      dueDate: toDate(2),
      status: 'Todo',
      reason: paidLead.nextAction || 'Có paid signal thì phải hỏi objection, giá, điều kiện mua và demo tiếp theo.'
    });
  } else if (demoLead) {
    actions.push({
      id: 'demo-followup',
      title: `Chuyển demo thành paid signal: ${demoLead.name || demoLead.persona || 'Unnamed lead'}`,
      source: 'Lead Board',
      owner: 'Founder / AI Sales',
      dueDate: toDate(3),
      status: 'Todo',
      reason: demoLead.nextAction || 'Đã demo nhưng chưa có paid signal; cần hỏi giá trị thật và willingness-to-pay.'
    });
  } else {
    actions.push({
      id: 'find-demo-lead',
      title: 'Tìm 3 người để demo vấn đề thật trong tuần',
      source: 'Distribution Engine',
      owner: 'Founder / AI Research',
      dueDate: toDate(5),
      status: 'Todo',
      reason: 'Chưa có lead đủ mạnh; ưu tiên phỏng vấn/demo hơn là build thêm tính năng.'
    });
  }

  if (buildDecision) {
    actions.push({
      id: 'build-mvp',
      title: `Build bước nhỏ nhất cho: ${buildDecision.experiment || 'experiment BUILD'}`,
      source: 'Decision Log',
      owner: buildDecision.owner || 'Founder / AI Dev',
      dueDate: buildDecision.reviewDate || toDate(7),
      status: 'Todo',
      reason: buildDecision.nextAction || 'Có quyết định BUILD thì phải giảm scope thành task nhỏ có thể test.'
    });
  } else {
    actions.push({
      id: 'create-build-decision',
      title: 'Tạo 1 quyết định BUILD/HOLD/KILL dựa trên dữ liệu tuần này',
      source: 'Decision Log',
      owner: 'Founder',
      dueDate: toDate(6),
      status: 'Todo',
      reason: 'Nếu không có decision log thì mọi việc chỉ là cảm tính.'
    });
  }

  if (riskyTool) {
    actions.push({
      id: 'tool-risk',
      title: `Xử lý tool ${riskyTool.decision}: ${riskyTool.name || 'Unnamed tool'}`,
      source: 'Tool Budget',
      owner: 'Founder / AI Ops',
      dueDate: riskyTool.decision === 'Cancel' ? toDate(2) : toDate(7),
      status: 'Todo',
      reason: `Tool này đang tốn ${Number(riskyTool.monthlyCost || 0).toLocaleString('vi-VN')}đ/tháng; xử lý trước khi mua thêm tool.`
    });
  }

  if (interviews.length < 5 || painAvg < 6 || payAvg < 5 || evidenceAvg < 5) {
    actions.push({
      id: 'persona-interviews',
      title: 'Thực hiện thêm 5 persona interviews có ghi pain/pay/evidence',
      source: 'Persona Interview',
      owner: 'Founder / AI Research',
      dueDate: toDate(7),
      status: 'Todo',
      reason: 'Tín hiệu persona chưa đủ mạnh; cần dữ liệu trước khi mở rộng sản phẩm.'
    });
  }

  return actions;
};

const statusOptions: ActionStatus[] = ['Todo', 'Doing', 'Done', 'Blocked'];

export default function WeeklyActionPlanner() {
  const suggested = useMemo(buildSuggestedActions, []);
  const [actions, setActions] = useState<WeeklyAction[]>(() => {
    const saved = readArray<WeeklyAction>(storageKey);
    return saved.length ? saved : suggested;
  });

  const save = (next: WeeklyAction[]) => {
    setActions(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const updateStatus = (id: string, status: ActionStatus) => {
    save(actions.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const resetFromSignals = () => save(suggested);
  const doneCount = actions.filter((item) => item.status === 'Done').length;
  const blockedCount = actions.filter((item) => item.status === 'Blocked').length;
  const doingCount = actions.filter((item) => item.status === 'Doing').length;
  const completion = actions.length ? Math.round((doneCount / actions.length) * 100) : 0;

  return (
    <section className="space-y-4 text-text-primary">
      <div className="rounded-3xl border border-border-primary bg-bg-primary p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-success">Weekly Action Planner</p>
            <h2 className="mt-2 text-xl font-bold text-text-primary">Kế hoạch hành động tuần</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
              Tự sinh việc từ interview, lead, decision và tool budget. Dùng để chốt tuần này làm gì, ai làm, hạn ngày nào và trạng thái ra sao.
            </p>
          </div>
          <button onClick={resetFromSignals} className="rounded-2xl border border-success/30 bg-emerald-400 px-4 py-3 text-xs font-bold text-slate-950">Tạo lại từ dữ liệu mới</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-5"><p className="text-[10px] font-bold uppercase text-text-muted">Tổng việc</p><p className="mt-2 text-3xl font-bold text-text-primary">{actions.length}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-5"><p className="text-[10px] font-bold uppercase text-text-muted">Đang làm</p><p className="mt-2 text-3xl font-bold text-text-primary">{doingCount}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-5"><p className="text-[10px] font-bold uppercase text-text-muted">Blocked</p><p className="mt-2 text-3xl font-bold text-text-primary">{blockedCount}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-5"><p className="text-[10px] font-bold uppercase text-text-muted">Hoàn thành</p><p className="mt-2 text-3xl font-bold text-text-primary">{completion}%</p></div>
      </div>

      <div className="space-y-3">
        {actions.map((action) => (
          <div key={action.id} className="rounded-2xl border border-border-primary bg-bg-surface p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-info">{action.source}</p>
                <h3 className="mt-1 text-sm font-bold text-text-primary">{action.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{action.reason}</p>
                <p className="mt-2 text-[11px] font-bold text-text-muted">Owner: {action.owner} • Deadline: {action.dueDate}</p>
              </div>
              <select value={action.status} onChange={(event) => updateStatus(action.id, event.target.value as ActionStatus)} className="rounded-xl border border-border-secondary bg-bg-primary px-3 py-2 text-xs font-bold text-text-primary">
                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
