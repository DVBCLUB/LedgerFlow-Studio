import { useEffect, useMemo, useState } from 'react';

type ChecklistStatus = 'Draft' | 'Ready' | 'Approved' | 'Rejected';
type ChecklistRisk = 'LOW' | 'MEDIUM' | 'HIGH';

type ReviewChecklist = {
  id: string;
  at: string;
  title: string;
  repo: string;
  branch: string;
  source: 'Manual' | 'Sandbox' | 'Diff Review' | 'Review Desk' | 'Session';
  risk: ChecklistRisk;
  status: ChecklistStatus;
  objectiveClear: boolean;
  filesReviewed: boolean;
  noSensitiveFiles: boolean;
  noSecretsInContent: boolean;
  hasRollbackPlan: boolean;
  hasTestPlan: boolean;
  approvalPhraseConfirmed: boolean;
  notes: string;
};

type ChecklistEvent = {
  id: string;
  at: string;
  checklistId: string;
  action: string;
  detail: string;
};

const defaultChecklist: ReviewChecklist = {
  id: 'founder-review-default',
  at: 'Mặc định',
  title: 'Review trước khi AI tạo Draft PR',
  repo: 'DVBCLUB/LedgerFlow-Studio',
  branch: 'ai/safe-change',
  source: 'Manual',
  risk: 'MEDIUM',
  status: 'Draft',
  objectiveClear: false,
  filesReviewed: false,
  noSensitiveFiles: false,
  noSecretsInContent: false,
  hasRollbackPlan: false,
  hasTestPlan: false,
  approvalPhraseConfirmed: false,
  notes: 'Checklist này dùng để founder kiểm tra trước khi đẩy patch sang Review Desk.'
};

const keys: Array<keyof Pick<ReviewChecklist, 'objectiveClear' | 'filesReviewed' | 'noSensitiveFiles' | 'noSecretsInContent' | 'hasRollbackPlan' | 'hasTestPlan' | 'approvalPhraseConfirmed'>> = [
  'objectiveClear',
  'filesReviewed',
  'noSensitiveFiles',
  'noSecretsInContent',
  'hasRollbackPlan',
  'hasTestPlan',
  'approvalPhraseConfirmed'
];

const labels: Record<typeof keys[number], string> = {
  objectiveClear: 'Mục tiêu thay đổi rõ ràng, không lệch phạm vi',
  filesReviewed: 'Đã xem danh sách file và diff/preview',
  noSensitiveFiles: 'Không chạm file nhạy cảm / cấu hình bí mật',
  noSecretsInContent: 'Không có API key, token, private key trong nội dung',
  hasRollbackPlan: 'Có cách rollback / revert nếu lỗi',
  hasTestPlan: 'Có kế hoạch test / CI / build',
  approvalPhraseConfirmed: 'Founder xác nhận approval phrase trước khi tạo PR'
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeReviewDeskPrefill(checklist: ReviewChecklist) {
  localStorage.setItem('ledgerflow_review_desk_founder_checklist_v1', JSON.stringify({
    checklistId: checklist.id,
    title: checklist.title,
    repo: checklist.repo,
    branch: checklist.branch,
    risk: checklist.risk,
    status: checklist.status,
    source: checklist.source,
    notes: checklist.notes,
    checks: keys.map((key) => ({ key, label: labels[key], checked: checklist[key] })),
    at: new Date().toISOString()
  }));
  window.dispatchEvent(new CustomEvent('ledgerflow-founder-review-synced'));
}

function exportJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function statusClass(status: ChecklistStatus) {
  if (status === 'Approved') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (status === 'Rejected') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  if (status === 'Ready') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  return 'border-slate-700 bg-slate-950 text-slate-300';
}

export default function FounderReviewChecklist() {
  const [items, setItems] = useState<ReviewChecklist[]>(() => readLocal('ledgerflow_founder_review_checklists_v1', [defaultChecklist]));
  const [events, setEvents] = useState<ChecklistEvent[]>(() => readLocal('ledgerflow_founder_review_events_v1', []));
  const [selectedId, setSelectedId] = useState(() => readLocal('ledgerflow_founder_review_checklists_v1', [defaultChecklist])[0]?.id ?? defaultChecklist.id);
  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId]);
  const selectedEvents = useMemo(() => events.filter((event) => event.checklistId === selected?.id), [events, selected?.id]);

  useEffect(() => {
    localStorage.setItem('ledgerflow_founder_review_checklists_v1', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('ledgerflow_founder_review_events_v1', JSON.stringify(events));
  }, [events]);

  const pushEvent = (checklistId: string, action: string, detail: string) => {
    setEvents((current) => [{ id: `founder-review-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), checklistId, action, detail }, ...current].slice(0, 160));
  };

  const updateSelected = (patch: Partial<ReviewChecklist>, action = 'CHECKLIST_UPDATED') => {
    if (!selected) return;
    setItems((current) => current.map((item) => item.id === selected.id ? { ...item, ...patch } : item));
    pushEvent(selected.id, action, JSON.stringify(patch));
  };

  const createChecklist = () => {
    const item: ReviewChecklist = {
      ...defaultChecklist,
      id: `founder-review-${Date.now()}`,
      at: new Date().toLocaleString('vi-VN'),
      title: 'Review AI patch mới',
      status: 'Draft'
    };
    setItems((current) => [item, ...current]);
    setSelectedId(item.id);
    pushEvent(item.id, 'CHECKLIST_CREATED', 'Tạo checklist review mới.');
  };

  const completion = selected ? Math.round(keys.filter((key) => selected[key]).length / keys.length * 100) : 0;
  const canApprove = selected && keys.every((key) => selected[key]);

  const approve = () => {
    if (!selected || !canApprove) return;
    const approved = { ...selected, status: 'Approved' as ChecklistStatus };
    setItems((current) => current.map((item) => item.id === selected.id ? approved : item));
    writeReviewDeskPrefill(approved);
    pushEvent(selected.id, 'FOUNDER_APPROVED', 'Founder đã duyệt checklist và đồng bộ sang Review Desk context.');
  };

  const sendToReviewDesk = () => {
    if (!selected) return;
    writeReviewDeskPrefill(selected);
    pushEvent(selected.id, 'SENT_TO_REVIEW_DESK_CONTEXT', 'Đưa checklist sang Review Desk context.');
    window.location.hash = '#/review_desk';
  };

  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Founder review checklist</p>
          <h3 className="mt-1 text-xl font-black text-white">Checklist trước khi AI tạo PR</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Kiểm soát mục tiêu, file, secret, rollback và test trước khi patch đi sang Review Desk.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={createChecklist} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950">Tạo checklist</button>
          <button onClick={() => exportJson('ledgerflow-founder-review.json', { items, events })} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-300">Xuất log</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-2 rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          {items.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === item.id ? 'border-emerald-300 bg-emerald-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-emerald-400/40'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-white">{item.title}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(item.status)}`}>{item.status}</span>
            </div>
            <p className="mt-1 text-[11px] font-bold text-slate-500">{item.source} · {item.risk} · {item.at}</p>
          </button>)}
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected checklist</p>
              <input className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-lg font-black text-white" value={selected.title} onChange={(event) => updateSelected({ title: event.target.value })} />
              <p className="mt-2 text-xs font-bold text-slate-500">{selected.repo} · {selected.branch}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(selected.status)}`}>{completion}%</span>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={selected.repo} onChange={(event) => updateSelected({ repo: event.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={selected.branch} onChange={(event) => updateSelected({ branch: event.target.value })} />
            <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={selected.source} onChange={(event) => updateSelected({ source: event.target.value as ReviewChecklist['source'] })}>
              {(['Manual', 'Sandbox', 'Diff Review', 'Review Desk', 'Session'] as ReviewChecklist['source'][]).map((source) => <option key={source}>{source}</option>)}
            </select>
            <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={selected.risk} onChange={(event) => updateSelected({ risk: event.target.value as ChecklistRisk })}>
              {(['LOW', 'MEDIUM', 'HIGH'] as ChecklistRisk[]).map((risk) => <option key={risk}>{risk}</option>)}
            </select>
          </div>

          <div className="mt-4 space-y-2">
            {keys.map((key) => <label key={key} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <input type="checkbox" checked={selected[key]} onChange={(event) => updateSelected({ [key]: event.target.checked } as Partial<ReviewChecklist>, 'CHECK_TOGGLED')} className="mt-1" />
              <span className="text-sm font-semibold leading-6 text-slate-300">{labels[key]}</span>
            </label>)}
          </div>

          <textarea className="mt-4 min-h-[100px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={selected.notes} onChange={(event) => updateSelected({ notes: event.target.value })} />

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => updateSelected({ status: 'Ready' }, 'CHECKLIST_READY')} className="rounded-2xl border border-amber-400/40 px-4 py-2 text-xs font-black text-amber-200 hover:bg-amber-400/10">Đánh dấu Ready</button>
            <button disabled={!canApprove} onClick={approve} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">Founder Approve</button>
            <button onClick={() => updateSelected({ status: 'Rejected' }, 'CHECKLIST_REJECTED')} className="rounded-2xl border border-rose-400/40 px-4 py-2 text-xs font-black text-rose-200 hover:bg-rose-400/10">Reject</button>
            <button onClick={sendToReviewDesk} className="rounded-2xl border border-cyan-400/40 px-4 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-400/10">Gửi context sang Review Desk</button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Checklist events</p>
            <div className="mt-2 max-h-36 space-y-2 overflow-y-auto">
              {selectedEvents.map((event) => <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <p className="text-[10px] font-black text-emerald-200">{event.action}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{event.detail}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-600">{event.at}</p>
              </div>)}
              {selectedEvents.length === 0 && <p className="text-xs font-semibold text-slate-500">Chưa có event.</p>}
            </div>
          </div>
        </div>}
      </div>
    </section>
  );
}
