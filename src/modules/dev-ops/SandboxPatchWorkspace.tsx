import { useEffect, useMemo, useState } from 'react';

type PatchStatus = 'Draft' | 'Ready for Review Desk' | 'Blocked' | 'Sent';
type PatchRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';

type SandboxPatch = {
  id: string;
  title: string;
  repo: string;
  branchName: string;
  summary: string;
  filePath: string;
  fileContent: string;
  status: PatchStatus;
  risk: PatchRisk;
  createdAt: string;
  source?: string;
  findings: string[];
};

type SandboxEvent = {
  id: string;
  at: string;
  patchId: string;
  action: string;
  detail: string;
};

const blockedPathTokens = [
  '.env',
  '.git/',
  'node_modules/',
  'dist/',
  'release/',
  'ai_keys.vault',
  'ledgerflow_secret',
  'id_rsa',
  'id_ed25519',
  '.pem',
  '.key'
];

const sensitiveContentTokens = [
  'api_key',
  'access_token',
  'refresh_token',
  'private_key',
  'client_secret',
  'github_pat_',
  'ghp_',
  'sk-',
  '-----BEGIN'
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function scanPatch(filePath: string, content: string): { risk: PatchRisk; findings: string[] } {
  const findings: string[] = [];
  const lowerPath = filePath.toLowerCase();
  const lowerContent = content.toLowerCase();

  blockedPathTokens.forEach((token) => {
    if (lowerPath.includes(token.toLowerCase())) findings.push(`Blocked path token: ${token}`);
  });
  sensitiveContentTokens.forEach((token) => {
    if (lowerContent.includes(token.toLowerCase())) findings.push(`Sensitive content token: ${token}`);
  });
  if (!filePath.trim()) findings.push('Missing file path');
  if (!content.trim()) findings.push('Missing file content');
  if (content.length > 250000) findings.push('File content is too large for approved PR flow');
  if (filePath.startsWith('/') || filePath.includes('..')) findings.push('Unsafe relative path');

  if (findings.some((finding) => finding.startsWith('Blocked') || finding.startsWith('Sensitive') || finding.includes('Unsafe'))) {
    return { risk: 'BLOCKED', findings };
  }
  if (content.length > 120000) return { risk: 'HIGH', findings: [...findings, 'Large patch needs careful review'] };
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js')) return { risk: 'MEDIUM', findings };
  return { risk: 'LOW', findings };
}

function riskClass(risk: PatchRisk) {
  if (risk === 'LOW') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (risk === 'MEDIUM') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  if (risk === 'HIGH') return 'border-orange-400/35 bg-orange-400/10 text-orange-200';
  return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
}

function statusClass(status: PatchStatus) {
  if (status === 'Sent') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (status === 'Ready for Review Desk') return 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200';
  if (status === 'Blocked') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  return 'border-slate-700 bg-slate-950 text-slate-300';
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

const emptyDraft = {
  title: '',
  repo: 'DVBCLUB/LedgerFlow-Studio',
  branchName: 'ai/sandbox-patch',
  summary: '',
  filePath: 'docs/AI_SANDBOX_PATCH.md',
  fileContent: ''
};

export default function SandboxPatchWorkspace() {
  const [patches, setPatches] = useState<SandboxPatch[]>(() => readLocal('ledgerflow_sandbox_patches_v1', []));
  const [events, setEvents] = useState<SandboxEvent[]>(() => readLocal('ledgerflow_sandbox_patch_events_v1', []));
  const [draft, setDraft] = useState(emptyDraft);
  const [selectedId, setSelectedId] = useState<string | null>(() => readLocal<SandboxPatch[]>('ledgerflow_sandbox_patches_v1', [])[0]?.id ?? null);

  useEffect(() => {
    localStorage.setItem('ledgerflow_sandbox_patches_v1', JSON.stringify(patches));
  }, [patches]);

  useEffect(() => {
    localStorage.setItem('ledgerflow_sandbox_patch_events_v1', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const importPrefill = () => {
      const prefill = readLocal<Partial<typeof emptyDraft> | null>('ledgerflow_sandbox_patch_prefill_v1', null);
      if (!prefill) return;
      setDraft((current) => ({ ...current, ...prefill }));
      localStorage.removeItem('ledgerflow_sandbox_patch_prefill_v1');
    };
    importPrefill();
    window.addEventListener('ledgerflow-sandbox-patch-prefill', importPrefill);
    return () => window.removeEventListener('ledgerflow-sandbox-patch-prefill', importPrefill);
  }, []);

  const selected = useMemo(() => patches.find((patch) => patch.id === selectedId) ?? patches[0], [patches, selectedId]);
  const selectedEvents = useMemo(() => events.filter((event) => event.patchId === selected?.id), [events, selected?.id]);
  const draftScan = useMemo(() => scanPatch(draft.filePath, draft.fileContent), [draft.filePath, draft.fileContent]);

  const pushEvent = (patchId: string, action: string, detail: string) => {
    setEvents((current) => [{ id: `sandbox-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), patchId, action, detail }, ...current].slice(0, 120));
  };

  const createPatch = () => {
    const scan = scanPatch(draft.filePath, draft.fileContent);
    const patch: SandboxPatch = {
      id: `sandbox-patch-${Date.now()}`,
      title: draft.title.trim() || 'Untitled sandbox patch',
      repo: draft.repo.trim() || 'DVBCLUB/LedgerFlow-Studio',
      branchName: draft.branchName.trim() || `ai/sandbox-${Date.now()}`,
      summary: draft.summary.trim(),
      filePath: draft.filePath.trim(),
      fileContent: draft.fileContent,
      status: scan.risk === 'BLOCKED' ? 'Blocked' : 'Draft',
      risk: scan.risk,
      createdAt: new Date().toLocaleString('vi-VN'),
      source: 'Sandbox Patch Workspace',
      findings: scan.findings
    };
    setPatches((current) => [patch, ...current]);
    setSelectedId(patch.id);
    pushEvent(patch.id, 'PATCH_CREATED', `Created with risk ${patch.risk}.`);
    setDraft(emptyDraft);
  };

  const markReady = () => {
    if (!selected || selected.risk === 'BLOCKED') return;
    setPatches((current) => current.map((patch) => patch.id === selected.id ? { ...patch, status: 'Ready for Review Desk' } : patch));
    pushEvent(selected.id, 'PATCH_READY', 'Marked ready for Review Desk.');
  };

  const sendToReviewDesk = () => {
    if (!selected || selected.risk === 'BLOCKED') return;
    localStorage.setItem('ledgerflow_review_desk_prefill_v1', JSON.stringify({
      sourceSandboxPatchId: selected.id,
      title: selected.title,
      repo: selected.repo,
      branchName: selected.branchName.startsWith('ai/') ? selected.branchName : `ai/${selected.branchName}`,
      summary: `${selected.summary}\n\nSandbox Patch: ${selected.id}\nRisk: ${selected.risk}\nFindings: ${selected.findings.length ? selected.findings.join('; ') : 'No blocking findings'}`,
      filePath: selected.filePath,
      fileContent: selected.fileContent
    }));
    setPatches((current) => current.map((patch) => patch.id === selected.id ? { ...patch, status: 'Sent' } : patch));
    pushEvent(selected.id, 'SENT_TO_REVIEW_DESK', 'Sent sanitized patch to Review Desk prefill.');
    window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill'));
    window.location.hash = '#/review_desk';
  };

  const removeSelected = () => {
    if (!selected) return;
    setPatches((current) => current.filter((patch) => patch.id !== selected.id));
    setSelectedId(null);
  };

  return (
    <section className="rounded-3xl border border-teal-400/35 bg-teal-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-200">Sandbox patch workspace</p>
          <h3 className="mt-1 text-xl font-black text-white">Khu nháp patch an toàn</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Soạn patch, quét risk, preview nội dung rồi mới đưa sang Review Desk tạo Draft PR.</p>
        </div>
        <button onClick={() => exportJson('ledgerflow-sandbox-patches.json', { patches, events })} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-teal-300">Xuất sandbox log</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Tạo patch nháp</p>
          <div className="mt-3 grid gap-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tiêu đề patch" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Repo" value={draft.repo} onChange={(event) => setDraft({ ...draft, repo: event.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Branch ai/..." value={draft.branchName} onChange={(event) => setDraft({ ...draft, branchName: event.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="File path" value={draft.filePath} onChange={(event) => setDraft({ ...draft, filePath: event.target.value })} />
            <textarea className="min-h-[80px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Summary" value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
            <textarea className="min-h-[180px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-white" placeholder="File content" value={draft.fileContent} onChange={(event) => setDraft({ ...draft, fileContent: event.target.value })} />
            <div className={`rounded-2xl border p-3 text-xs font-bold ${riskClass(draftScan.risk)}`}>
              Risk: {draftScan.risk}{draftScan.findings.length ? ` · ${draftScan.findings.join(' · ')}` : ' · No blocking findings'}
            </div>
            <button onClick={createPatch} className="rounded-2xl bg-teal-300 px-4 py-2 text-xs font-black text-slate-950">Tạo patch nháp</button>
          </div>

          <div className="mt-4 space-y-2">
            {patches.map((patch) => <button key={patch.id} onClick={() => setSelectedId(patch.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === patch.id ? 'border-teal-300 bg-teal-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-teal-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{patch.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(patch.status)}`}>{patch.status}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-400">{patch.filePath} · {patch.risk} · {patch.createdAt}</p>
            </button>)}
            {patches.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm font-semibold text-slate-400">Chưa có patch nháp nào.</p>}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected patch</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.title}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.repo} · {selected.branchName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${riskClass(selected.risk)}`}>{selected.risk}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(selected.status)}`}>{selected.status}</span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Diff preview / file content</p>
            <p className="mt-2 text-xs font-bold text-teal-200">{selected.filePath}</p>
            <pre className="mt-2 max-h-[280px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs leading-5 text-slate-300">{selected.fileContent}</pre>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Scan findings</p>
            {selected.findings.length ? <ul className="mt-2 space-y-1 text-xs font-semibold text-amber-200">{selected.findings.map((finding) => <li key={finding}>• {finding}</li>)}</ul> : <p className="mt-2 text-xs font-semibold text-emerald-200">No blocking findings.</p>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button disabled={selected.risk === 'BLOCKED'} onClick={markReady} className="rounded-2xl border border-cyan-400/40 px-4 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40">Mark ready</button>
            <button disabled={selected.risk === 'BLOCKED'} onClick={sendToReviewDesk} className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-40">Đưa sang Review Desk</button>
            <button onClick={removeSelected} className="rounded-2xl border border-rose-400/40 px-4 py-2 text-xs font-black text-rose-200 hover:bg-rose-400/10">Xóa</button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Sandbox events</p>
            <div className="mt-2 max-h-36 space-y-2 overflow-y-auto">
              {selectedEvents.map((event) => <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <p className="text-[10px] font-black text-teal-200">{event.action}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{event.detail}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-600">{event.at}</p>
              </div>)}
              {selectedEvents.length === 0 && <p className="text-xs font-semibold text-slate-500">Chưa có event cho patch này.</p>}
            </div>
          </div>
        </div>}
      </div>
    </section>
  );
}
