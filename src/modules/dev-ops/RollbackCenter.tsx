import { useEffect, useMemo, useState } from 'react';

type RollbackStatus = 'Draft' | 'Ready' | 'Needs Review' | 'Blocked' | 'Completed';
type RollbackRisk = 'LOW' | 'MEDIUM' | 'HIGH';

type RollbackRecord = {
  id: string;
  createdAt: string;
  title: string;
  repo: string;
  sourceBranch: string;
  sourcePrNumber?: number | null;
  sourcePrUrl?: string | null;
  sourceCommitSha?: string;
  risk: RollbackRisk;
  status: RollbackStatus;
  reason: string;
  rollbackPlan: string;
  files: string[];
  testPlan: string;
};

type RollbackEvent = {
  id: string;
  at: string;
  recordId: string;
  action: string;
  detail: string;
};

const storageKey = 'ledgerflow_rollback_records_v1';
const eventKey = 'ledgerflow_rollback_events_v1';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
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

function readReviewDeskResult(): Partial<RollbackRecord> | null {
  try {
    const raw = localStorage.getItem('ledgerflow_review_desk_last_result_v1');
    if (!raw) return null;
    const payload = JSON.parse(raw);
    const result = payload?.result ?? payload;
    return {
      title: result?.title ?? payload?.title ?? 'AI generated PR',
      repo: result?.repo ?? payload?.repo ?? 'DVBCLUB/LedgerFlow-Studio',
      sourceBranch: result?.branch ?? payload?.branch ?? payload?.branchName ?? 'ai/unknown',
      sourcePrNumber: result?.pullRequest?.number ?? result?.prNumber ?? payload?.prNumber ?? null,
      sourcePrUrl: result?.pullRequest?.htmlUrl ?? result?.prUrl ?? payload?.prUrl ?? null,
      sourceCommitSha: result?.commitSha ?? payload?.commitSha ?? ''
    };
  } catch {
    return null;
  }
}

function readMultifileResult(): string[] {
  try {
    const raw = localStorage.getItem('ledgerflow_review_desk_last_multifile_v1');
    if (!raw) return [];
    const payload = JSON.parse(raw);
    return Array.isArray(payload?.files) ? payload.files.map((file: { path?: string }) => file.path).filter(Boolean) : [];
  } catch {
    return [];
  }
}

const initialRecords: RollbackRecord[] = [
  {
    id: 'rollback-template-001',
    createdAt: 'Mặc định',
    title: 'Rollback template for AI-created PR',
    repo: 'DVBCLUB/LedgerFlow-Studio',
    sourceBranch: 'ai/example',
    sourcePrNumber: null,
    sourcePrUrl: null,
    sourceCommitSha: '',
    risk: 'MEDIUM',
    status: 'Draft',
    reason: 'Mẫu kế hoạch rollback cho thay đổi do AI tạo.',
    rollbackPlan: 'Tạo PR revert riêng, không force push main. Kiểm tra diff trước khi merge.',
    files: ['src/example.tsx'],
    testPlan: 'Chạy build, kiểm tra UI liên quan, xác nhận không mất dữ liệu localStorage.'
  }
];

function statusClass(status: RollbackStatus) {
  if (status === 'Completed') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (status === 'Ready') return 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200';
  if (status === 'Needs Review') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  if (status === 'Blocked') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  return 'border-border-secondary bg-slate-950 text-text-secondary';
}

export default function RollbackCenter() {
  const [records, setRecords] = useState<RollbackRecord[]>(() => readLocal(storageKey, initialRecords));
  const [events, setEvents] = useState<RollbackEvent[]>(() => readLocal(eventKey, []));
  const [selectedId, setSelectedId] = useState(() => readLocal<RollbackRecord[]>(storageKey, initialRecords)[0]?.id ?? initialRecords[0].id);
  const [draft, setDraft] = useState({
    title: '',
    repo: 'DVBCLUB/LedgerFlow-Studio',
    sourceBranch: 'ai/',
    sourcePrNumber: '',
    sourcePrUrl: '',
    sourceCommitSha: '',
    risk: 'MEDIUM' as RollbackRisk,
    reason: '',
    rollbackPlan: 'Tạo PR revert riêng, không sửa trực tiếp main. Soát diff và chạy build trước khi merge.',
    filesText: '',
    testPlan: 'npm run build; kiểm tra màn hình bị ảnh hưởng; xác nhận không mất dữ liệu.'
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(eventKey, JSON.stringify(events));
  }, [events]);

  const selected = useMemo(() => records.find((record) => record.id === selectedId) ?? records[0], [records, selectedId]);
  const selectedEvents = useMemo(() => events.filter((event) => event.recordId === selected?.id), [events, selected?.id]);

  const pushEvent = (recordId: string, action: string, detail: string) => {
    setEvents((current) => [{ id: `rollback-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), recordId, action, detail }, ...current].slice(0, 200));
  };

  const createRecord = () => {
    if (!draft.title.trim() || !draft.repo.trim() || !draft.sourceBranch.trim()) return;
    const record: RollbackRecord = {
      id: `rollback-${Date.now()}`,
      createdAt: new Date().toLocaleString('vi-VN'),
      title: draft.title.trim(),
      repo: draft.repo.trim(),
      sourceBranch: draft.sourceBranch.trim(),
      sourcePrNumber: draft.sourcePrNumber ? Number(draft.sourcePrNumber) : null,
      sourcePrUrl: draft.sourcePrUrl.trim() || null,
      sourceCommitSha: draft.sourceCommitSha.trim(),
      risk: draft.risk,
      status: 'Draft',
      reason: draft.reason.trim() || 'Cần có rollback plan trước khi merge thay đổi do AI tạo.',
      rollbackPlan: draft.rollbackPlan.trim(),
      files: draft.filesText.split('\n').map((line) => line.trim()).filter(Boolean),
      testPlan: draft.testPlan.trim()
    };
    setRecords((current) => [record, ...current]);
    setSelectedId(record.id);
    pushEvent(record.id, 'ROLLBACK_RECORD_CREATED', `Tạo rollback record cho ${record.sourceBranch}.`);
    setDraft({ ...draft, title: '', sourcePrNumber: '', sourcePrUrl: '', sourceCommitSha: '', reason: '', filesText: '' });
  };

  const importLatestReviewDesk = () => {
    const latest = readReviewDeskResult();
    if (!latest) return;
    const files = readMultifileResult();
    setDraft((current) => ({
      ...current,
      title: `Rollback plan for ${latest.title ?? latest.sourceBranch ?? 'latest PR'}`,
      repo: latest.repo ?? current.repo,
      sourceBranch: latest.sourceBranch ?? current.sourceBranch,
      sourcePrNumber: latest.sourcePrNumber ? String(latest.sourcePrNumber) : current.sourcePrNumber,
      sourcePrUrl: latest.sourcePrUrl ?? current.sourcePrUrl,
      sourceCommitSha: latest.sourceCommitSha ?? current.sourceCommitSha,
      filesText: files.length ? files.join('\n') : current.filesText,
      reason: 'Theo dõi rollback cho PR do AI tạo từ Review Desk.'
    }));
  };

  const updateSelected = (patch: Partial<RollbackRecord>, action: string, detail: string) => {
    if (!selected) return;
    setRecords((current) => current.map((record) => record.id === selected.id ? { ...record, ...patch } : record));
    pushEvent(selected.id, action, detail);
  };

  const sendToFounderReview = () => {
    if (!selected) return;
    localStorage.setItem('ledgerflow_founder_review_prefill_v1', JSON.stringify({
      title: `Review rollback plan: ${selected.title}`,
      sourceRollbackId: selected.id,
      summary: `${selected.reason}\n\nRollback plan:\n${selected.rollbackPlan}\n\nFiles:\n${selected.files.join('\n')}`,
      risk: selected.risk,
      testPlan: selected.testPlan
    }));
    window.dispatchEvent(new CustomEvent('ledgerflow-founder-review-prefill'));
    pushEvent(selected.id, 'SENT_TO_FOUNDER_REVIEW', 'Đưa rollback plan sang Founder Review Checklist.');
  };

  const sendToReviewDesk = () => {
    if (!selected) return;
    localStorage.setItem('ledgerflow_review_desk_prefill_v1', JSON.stringify({
      title: `Rollback: ${selected.title}`,
      branchName: `ai/rollback-${selected.sourceBranch.replace(/^ai\//, '').replace(/[^a-zA-Z0-9-]+/g, '-').toLowerCase().slice(0, 36)}`,
      summary: `Rollback request\n\nSource PR: ${selected.sourcePrNumber ?? 'N/A'}\nSource branch: ${selected.sourceBranch}\nReason: ${selected.reason}\n\nPlan:\n${selected.rollbackPlan}\n\nTest plan:\n${selected.testPlan}`,
      filePath: `docs/rollback/${selected.id}.md`,
      fileContent: `# ${selected.title}\n\n## Source\n\n- Repo: ${selected.repo}\n- Branch: ${selected.sourceBranch}\n- PR: ${selected.sourcePrNumber ?? 'N/A'}\n- Commit: ${selected.sourceCommitSha || 'N/A'}\n\n## Reason\n\n${selected.reason}\n\n## Rollback plan\n\n${selected.rollbackPlan}\n\n## Files\n\n${selected.files.map((file) => `- ${file}`).join('\n')}\n\n## Test plan\n\n${selected.testPlan}\n`,
      sourceRollbackId: selected.id
    }));
    window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill'));
    window.location.hash = '#/review_desk';
    pushEvent(selected.id, 'SENT_TO_REVIEW_DESK', 'Đưa rollback plan sang Review Desk.');
  };

  return (
    <section className="rounded-3xl border border-rose-400/35 bg-rose-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-200">Rollback center</p>
          <h3 className="mt-1 text-xl font-black text-text-primary">Trung tâm rollback / restore</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-text-secondary">Mỗi thay đổi do AI tạo phải có đường lui: PR nguồn, branch, file bị ảnh hưởng, kế hoạch revert và test lại.</p>
        </div>
        <button onClick={() => exportJson('ledgerflow-rollback-center.json', { records, events })} className="rounded-2xl border border-border-secondary px-4 py-2 text-xs font-black text-text-secondary hover:border-rose-300">Xuất rollback log</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-border-primary bg-slate-950/60 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-black text-text-primary">Tạo rollback record</p>
            <button onClick={importLatestReviewDesk} className="rounded-xl border border-rose-400/40 px-3 py-1.5 text-[11px] font-black text-rose-100 hover:bg-rose-400/10">Nhập PR mới nhất</button>
          </div>
          <div className="grid gap-2">
            <input className="rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm text-text-primary" placeholder="Tên rollback plan" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <input className="rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm text-text-primary" placeholder="Repo" value={draft.repo} onChange={(event) => setDraft({ ...draft, repo: event.target.value })} />
            <input className="rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm text-text-primary" placeholder="Source branch ai/..." value={draft.sourceBranch} onChange={(event) => setDraft({ ...draft, sourceBranch: event.target.value })} />
            <div className="grid gap-2 md:grid-cols-2">
              <input className="rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm text-text-primary" placeholder="Source PR number" value={draft.sourcePrNumber} onChange={(event) => setDraft({ ...draft, sourcePrNumber: event.target.value })} />
              <select className="rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm text-text-primary" value={draft.risk} onChange={(event) => setDraft({ ...draft, risk: event.target.value as RollbackRisk })}>
                <option>LOW</option><option>MEDIUM</option><option>HIGH</option>
              </select>
            </div>
            <input className="rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm text-text-primary" placeholder="PR URL" value={draft.sourcePrUrl} onChange={(event) => setDraft({ ...draft, sourcePrUrl: event.target.value })} />
            <input className="rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm text-text-primary" placeholder="Commit SHA" value={draft.sourceCommitSha} onChange={(event) => setDraft({ ...draft, sourceCommitSha: event.target.value })} />
            <textarea className="min-h-[70px] rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm leading-6 text-text-primary" placeholder="Lý do cần rollback plan" value={draft.reason} onChange={(event) => setDraft({ ...draft, reason: event.target.value })} />
            <textarea className="min-h-[90px] rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm leading-6 text-text-primary" placeholder="Rollback plan" value={draft.rollbackPlan} onChange={(event) => setDraft({ ...draft, rollbackPlan: event.target.value })} />
            <textarea className="min-h-[90px] rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm leading-6 text-text-primary" placeholder="Files, mỗi dòng một file" value={draft.filesText} onChange={(event) => setDraft({ ...draft, filesText: event.target.value })} />
            <textarea className="min-h-[70px] rounded-2xl border border-border-secondary bg-slate-950 px-3 py-2 text-sm leading-6 text-text-primary" placeholder="Test plan" value={draft.testPlan} onChange={(event) => setDraft({ ...draft, testPlan: event.target.value })} />
            <button onClick={createRecord} className="rounded-2xl bg-rose-300 px-4 py-2 text-xs font-black text-slate-950">Tạo rollback record</button>
          </div>

          <div className="mt-4 space-y-2">
            {records.map((record) => <button key={record.id} onClick={() => setSelectedId(record.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === record.id ? 'border-rose-300 bg-rose-400/10' : 'border-border-primary bg-slate-950/50 hover:border-rose-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-text-primary">{record.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(record.status)}`}>{record.status}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-text-secondary">{record.sourceBranch} · PR #{record.sourcePrNumber ?? '?'} · {record.risk}</p>
            </button>)}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-border-primary bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Selected rollback</p>
              <h4 className="mt-1 text-lg font-black text-text-primary">{selected.title}</h4>
              <p className="mt-1 text-xs font-bold text-text-secondary">{selected.repo} · {selected.sourceBranch} · Risk {selected.risk}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(selected.status)}`}>{selected.status}</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border-primary bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Reason</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{selected.reason}</p>
            </div>
            <div className="rounded-2xl border border-border-primary bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Source</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">PR #{selected.sourcePrNumber ?? 'N/A'}<br />Commit: {selected.sourceCommitSha || 'N/A'}</p>
              {selected.sourcePrUrl && <a className="mt-2 inline-flex text-xs font-black text-emerald-200 underline" href={selected.sourcePrUrl} target="_blank" rel="noreferrer">Mở source PR</a>}
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-border-primary bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Rollback plan</p>
            <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-6 text-text-secondary">{selected.rollbackPlan}</p>
          </div>

          <div className="mt-3 rounded-2xl border border-border-primary bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Files</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selected.files.map((file) => <span key={file} className="rounded-full border border-border-secondary px-3 py-1 text-[11px] font-bold text-text-secondary">{file}</span>)}
              {selected.files.length === 0 && <span className="text-xs font-semibold text-text-tertiary">Chưa ghi file.</span>}
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-border-primary bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Test plan</p>
            <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-6 text-text-secondary">{selected.testPlan}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(['Draft', 'Needs Review', 'Ready', 'Blocked', 'Completed'] as RollbackStatus[]).map((status) => <button key={status} onClick={() => updateSelected({ status }, 'ROLLBACK_STATUS_CHANGED', `Đổi rollback status sang ${status}.`)} className={`rounded-full border px-3 py-2 text-[11px] font-black ${selected.status === status ? 'border-rose-300 bg-rose-300 text-slate-950' : 'border-border-secondary text-text-secondary hover:border-rose-300'}`}>{status}</button>)}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={sendToFounderReview} className="rounded-2xl border border-amber-400/40 px-4 py-2 text-xs font-black text-amber-200 hover:bg-amber-400/10">Đưa sang Founder Review</button>
            <button onClick={sendToReviewDesk} className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Đưa sang Review Desk</button>
          </div>

          <div className="mt-4 rounded-2xl border border-border-primary bg-slate-950/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Rollback events</p>
            <div className="mt-2 max-h-44 space-y-2 overflow-y-auto">
              {selectedEvents.map((event) => <div key={event.id} className="rounded-xl border border-border-primary bg-slate-950 p-2">
                <p className="text-[10px] font-black text-rose-200">{event.action}</p>
                <p className="mt-1 text-[11px] font-semibold text-text-secondary">{event.detail}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-600">{event.at}</p>
              </div>)}
              {selectedEvents.length === 0 && <p className="text-xs font-semibold text-text-tertiary">Chưa có event.</p>}
            </div>
          </div>
        </div>}
      </div>
    </section>
  );
}
