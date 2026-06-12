import { useEffect, useMemo, useState } from 'react';

type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Expired';
type ApprovalRisk = 'LOW' | 'MEDIUM' | 'HIGH';

type ApprovalRequest = {
  id: string;
  title: string;
  source: string;
  risk: ApprovalRisk;
  action: string;
  details: string;
  createdAt: string;
  expiresAt: string;
  status: ApprovalStatus;
  approvedBy?: string;
  decidedAt?: string;
};

type ApprovalEvent = {
  id: string;
  at: string;
  requestId: string;
  action: string;
  detail: string;
};

const STORAGE_KEY = 'ledgerflow_approval_gate_requests_v1';
const EVENTS_KEY = 'ledgerflow_approval_gate_events_v1';
const REQUIRED_PHRASE = 'APPROVE AI GITHUB PUSH';

const defaultRequests: ApprovalRequest[] = [
  {
    id: 'approval-001',
    title: 'AI tạo Draft PR sau khi sửa code',
    source: 'Review Desk',
    risk: 'HIGH',
    action: 'Create branch ai/* and Draft PR',
    details: 'Chỉ cho phép tạo nhánh ai/* và Draft PR. Không merge thẳng main, không đụng file nhạy cảm, không ghi secret.',
    createdAt: 'Mặc định',
    expiresAt: 'Mặc định',
    status: 'Pending'
  }
];

const defaultEvents: ApprovalEvent[] = [
  { id: 'approval-event-001', at: 'Mặc định', requestId: 'approval-001', action: 'BOOTSTRAP', detail: 'Khởi tạo Approval Gate kiểu sandbox-first.' }
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function addHours(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function formatDate(value: string) {
  if (value === 'Mặc định') return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}

function isExpired(request: ApprovalRequest) {
  if (request.status !== 'Pending') return false;
  if (request.expiresAt === 'Mặc định') return false;
  return new Date(request.expiresAt).getTime() < Date.now();
}

function riskClass(risk: ApprovalRisk) {
  if (risk === 'HIGH') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  if (risk === 'MEDIUM') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
}

function statusClass(status: ApprovalStatus) {
  if (status === 'Approved') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (status === 'Rejected') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  if (status === 'Expired') return 'border-slate-600 bg-slate-900 text-slate-400';
  return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
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

export default function ApprovalGatePanel() {
  const [requests, setRequests] = useState<ApprovalRequest[]>(() => readLocal(STORAGE_KEY, defaultRequests));
  const [events, setEvents] = useState<ApprovalEvent[]>(() => readLocal(EVENTS_KEY, defaultEvents));
  const [selectedId, setSelectedId] = useState(() => requests[0]?.id ?? defaultRequests[0].id);
  const [phrase, setPhrase] = useState('');
  const [draft, setDraft] = useState({ title: '', source: 'Agent Session', risk: 'HIGH' as ApprovalRisk, action: '', details: '', hours: 2 });

  useEffect(() => {
    const refreshed = requests.map((request) => isExpired(request) ? { ...request, status: 'Expired' as ApprovalStatus } : request);
    if (JSON.stringify(refreshed) !== JSON.stringify(requests)) setRequests(refreshed);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }, [events]);

  const selected = useMemo(() => requests.find((request) => request.id === selectedId) ?? requests[0], [requests, selectedId]);
  const selectedEvents = useMemo(() => events.filter((event) => event.requestId === selected?.id), [events, selected?.id]);

  const pushEvent = (requestId: string, action: string, detail: string) => {
    setEvents((current) => [{ id: `approval-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), requestId, action, detail }, ...current].slice(0, 120));
  };

  const createRequest = () => {
    if (!draft.title.trim() || !draft.action.trim()) return;
    const request: ApprovalRequest = {
      id: `approval-${Date.now()}`,
      title: draft.title.trim(),
      source: draft.source.trim() || 'Manual',
      risk: draft.risk,
      action: draft.action.trim(),
      details: draft.details.trim() || 'Không có mô tả thêm.',
      createdAt: new Date().toISOString(),
      expiresAt: addHours(Number(draft.hours) || 2),
      status: 'Pending'
    };
    setRequests((current) => [request, ...current]);
    setSelectedId(request.id);
    pushEvent(request.id, 'REQUEST_CREATED', `Tạo yêu cầu duyệt ${request.action}.`);
    setDraft({ title: '', source: draft.source, risk: draft.risk, action: '', details: '', hours: draft.hours });
  };

  const decide = (status: 'Approved' | 'Rejected') => {
    if (!selected) return;
    if (status === 'Approved' && phrase !== REQUIRED_PHRASE) return;
    setRequests((current) => current.map((request) => request.id === selected.id ? {
      ...request,
      status,
      approvedBy: status === 'Approved' ? 'Founder' : undefined,
      decidedAt: new Date().toISOString()
    } : request));
    pushEvent(selected.id, status === 'Approved' ? 'APPROVED' : 'REJECTED', status === 'Approved' ? 'Founder đã duyệt bằng approval phrase.' : 'Founder từ chối yêu cầu.');
    setPhrase('');
  };

  const sendToReviewDesk = () => {
    if (!selected || selected.status !== 'Approved') return;
    localStorage.setItem('ledgerflow_review_desk_prefill_v1', JSON.stringify({
      sourceApprovalId: selected.id,
      title: selected.title,
      branchName: `ai/${selected.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 42) || 'approved-change'}`,
      summary: `${selected.details}\n\nApproval: ${selected.id}\nAction: ${selected.action}\nRisk: ${selected.risk}`,
      approvalPhrase: REQUIRED_PHRASE,
      filePath: 'docs/APPROVED_AI_CHANGE.md',
      fileContent: `# ${selected.title}\n\n## Approved action\n\n${selected.action}\n\n## Details\n\n${selected.details}\n\n## Approval\n\n- ID: ${selected.id}\n- Risk: ${selected.risk}\n- Status: ${selected.status}\n`
    }));
    pushEvent(selected.id, 'SEND_TO_REVIEW_DESK', 'Đưa yêu cầu đã duyệt sang Review Desk.');
    window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill'));
    window.location.hash = '#/review_desk';
  };

  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Approval gate</p>
          <h3 className="mt-1 text-xl font-black text-white">Cổng duyệt hành động AI</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Quản lý việc AI được phép làm, thời hạn duyệt và log quyết định trước khi sang Review Desk.</p>
        </div>
        <button onClick={() => exportJson('ledgerflow-approval-gate.json', { requests, events })} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-300">Xuất approval log</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Tạo yêu cầu duyệt</p>
          <div className="mt-3 grid gap-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tên yêu cầu" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Nguồn: Session / Workboard / Review Desk" value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} />
            <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.risk} onChange={(event) => setDraft({ ...draft, risk: event.target.value as ApprovalRisk })}>
              {(['LOW', 'MEDIUM', 'HIGH'] as ApprovalRisk[]).map((risk) => <option key={risk}>{risk}</option>)}
            </select>
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Hành động cần duyệt" value={draft.action} onChange={(event) => setDraft({ ...draft, action: event.target.value })} />
            <textarea className="min-h-[100px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Chi tiết / giới hạn / điều kiện duyệt" value={draft.details} onChange={(event) => setDraft({ ...draft, details: event.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" type="number" min={1} max={72} value={draft.hours} onChange={(event) => setDraft({ ...draft, hours: Number(event.target.value) })} />
            <button onClick={createRequest} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950">Tạo yêu cầu duyệt</button>
          </div>

          <div className="mt-4 space-y-2">
            {requests.map((request) => <button key={request.id} onClick={() => setSelectedId(request.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === request.id ? 'border-emerald-300 bg-emerald-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-emerald-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{request.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(request.status)}`}>{request.status}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-400">{request.source} · {request.risk} · hết hạn {formatDate(request.expiresAt)}</p>
            </button>)}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected approval</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.title}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.source} · tạo {formatDate(selected.createdAt)} · hết hạn {formatDate(selected.expiresAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${riskClass(selected.risk)}`}>{selected.risk}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(selected.status)}`}>{selected.status}</span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Action</p>
            <p className="mt-2 text-sm font-black text-white">{selected.action}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-300">{selected.details}</p>
          </div>

          {selected.status === 'Pending' && <div className="mt-4 rounded-2xl border border-amber-400/35 bg-amber-400/10 p-3">
            <p className="text-xs font-black text-amber-100">Muốn duyệt, nhập đúng phrase:</p>
            <code className="mt-2 block rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-black text-emerald-200">{REQUIRED_PHRASE}</code>
            <input className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Nhập approval phrase" value={phrase} onChange={(event) => setPhrase(event.target.value)} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => decide('Approved')} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-40" disabled={phrase !== REQUIRED_PHRASE}>Duyệt</button>
              <button onClick={() => decide('Rejected')} className="rounded-2xl border border-rose-400/40 px-4 py-2 text-xs font-black text-rose-200 hover:bg-rose-400/10">Từ chối</button>
            </div>
          </div>}

          {selected.status === 'Approved' && <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={sendToReviewDesk} className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Đưa sang Review Desk</button>
          </div>}

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Approval events</p>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
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
