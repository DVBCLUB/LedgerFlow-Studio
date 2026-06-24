import { useEffect, useMemo, useState } from 'react';

type BundleStatus = 'Draft' | 'Ready' | 'Blocked' | 'Sent';
type PatchRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
type FileAction = 'create' | 'update' | 'delete';

type PatchFile = {
  id: string;
  path: string;
  action: FileAction;
  beforeContent: string;
  afterContent: string;
  risk: PatchRisk;
  findings: string[];
};

type PatchBundle = {
  id: string;
  title: string;
  repo: string;
  branchName: string;
  summary: string;
  status: BundleStatus;
  risk: PatchRisk;
  createdAt: string;
  files: PatchFile[];
};

type PatchEvent = {
  id: string;
  at: string;
  bundleId: string;
  action: string;
  detail: string;
};

const blockedPathTokens = ['.env', '.git/', 'node_modules/', 'dist/', 'release/', 'ai_keys.vault', 'ledgerflow_secret', 'id_rsa', 'id_ed25519', '.pem', '.key'];
const sensitiveTokens = ['api_key', 'access_token', 'refresh_token', 'private_key', 'client_secret', 'github_pat_', 'ghp_', 'sk-', '-----BEGIN'];

const emptyFile: Omit<PatchFile, 'id' | 'risk' | 'findings'> = {
  path: 'docs/SAFE_PATCH.md',
  action: 'update',
  beforeContent: '',
  afterContent: ''
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function riskRank(risk: PatchRisk) {
  return risk === 'BLOCKED' ? 4 : risk === 'HIGH' ? 3 : risk === 'MEDIUM' ? 2 : 1;
}

function maxRisk(risks: PatchRisk[]): PatchRisk {
  return risks.reduce((max, risk) => riskRank(risk) > riskRank(max) ? risk : max, 'LOW' as PatchRisk);
}

function scanFile(path: string, action: FileAction, beforeContent: string, afterContent: string): { risk: PatchRisk; findings: string[] } {
  const findings: string[] = [];
  const lowerPath = path.toLowerCase();
  const targetContent = action === 'delete' ? beforeContent : afterContent;
  const lowerContent = targetContent.toLowerCase();

  if (!path.trim()) findings.push('Missing file path');
  if (path.startsWith('/') || path.includes('..')) findings.push('Unsafe relative path');
  if (action !== 'delete' && !afterContent.trim()) findings.push('Missing after content');
  if (targetContent.length > 250000) findings.push('File content is too large for approved PR flow');
  blockedPathTokens.forEach((token) => {
    if (lowerPath.includes(token.toLowerCase())) findings.push(`Blocked path token: ${token}`);
  });
  sensitiveTokens.forEach((token) => {
    if (lowerContent.includes(token.toLowerCase())) findings.push(`Sensitive content token: ${token}`);
  });

  if (findings.some((finding) => finding.startsWith('Blocked') || finding.startsWith('Sensitive') || finding.includes('Unsafe'))) return { risk: 'BLOCKED', findings };
  if (targetContent.length > 120000 || action === 'delete') return { risk: 'HIGH', findings };
  if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.js') || path.endsWith('.json')) return { risk: 'MEDIUM', findings };
  return { risk: 'LOW', findings };
}

function computeDiff(beforeContent: string, afterContent: string) {
  const before = beforeContent.split('\n');
  const after = afterContent.split('\n');
  const max = Math.max(before.length, after.length);
  const rows: { type: 'same' | 'add' | 'remove' | 'change'; line: string; index: number }[] = [];
  for (let index = 0; index < max; index += 1) {
    const oldLine = before[index];
    const newLine = after[index];
    if (oldLine === newLine) rows.push({ type: 'same', line: oldLine ?? '', index });
    else {
      if (oldLine !== undefined && newLine !== undefined) rows.push({ type: 'change', line: `- ${oldLine}\n+ ${newLine}`, index });
      else if (oldLine !== undefined) rows.push({ type: 'remove', line: oldLine, index });
      else rows.push({ type: 'add', line: newLine ?? '', index });
    }
  }
  return rows.slice(0, 420);
}

function riskClass(risk: PatchRisk) {
  if (risk === 'LOW') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (risk === 'MEDIUM') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  if (risk === 'HIGH') return 'border-orange-400/35 bg-orange-400/10 text-orange-200';
  return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
}

function statusClass(status: BundleStatus) {
  if (status === 'Sent') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (status === 'Ready') return 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200';
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

function normalizeBranch(branchName: string) {
  const cleaned = branchName.trim() || `ai/multifile-${Date.now()}`;
  return cleaned.startsWith('ai/') ? cleaned : `ai/${cleaned}`;
}

export default function PatchDiffReviewCenter() {
  const [bundles, setBundles] = useState<PatchBundle[]>(() => readLocal('ledgerflow_patch_diff_bundles_v1', []));
  const [events, setEvents] = useState<PatchEvent[]>(() => readLocal('ledgerflow_patch_diff_events_v1', []));
  const [selectedId, setSelectedId] = useState<string | null>(() => readLocal<PatchBundle[]>('ledgerflow_patch_diff_bundles_v1', [])[0]?.id ?? null);
  const [draftMeta, setDraftMeta] = useState({ title: '', repo: 'DVBCLUB/LedgerFlow-Studio', branchName: 'ai/multifile-safe-patch', summary: '' });
  const [draftFiles, setDraftFiles] = useState<Array<Omit<PatchFile, 'id' | 'risk' | 'findings'>>>([{ ...emptyFile }]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('ledgerflow_patch_diff_bundles_v1', JSON.stringify(bundles));
  }, [bundles]);

  useEffect(() => {
    localStorage.setItem('ledgerflow_patch_diff_events_v1', JSON.stringify(events));
  }, [events]);

  const selected = useMemo(() => bundles.find((bundle) => bundle.id === selectedId) ?? bundles[0], [bundles, selectedId]);
  const selectedFile = useMemo(() => selected?.files.find((file) => file.id === selectedFileId) ?? selected?.files[0], [selected, selectedFileId]);
  const selectedEvents = useMemo(() => events.filter((event) => event.bundleId === selected?.id), [events, selected?.id]);
  const diffRows = useMemo(() => selectedFile ? computeDiff(selectedFile.beforeContent, selectedFile.afterContent) : [], [selectedFile]);

  const draftScan = useMemo(() => {
    const scanned = draftFiles.map((file, index) => ({ index, ...scanFile(file.path, file.action, file.beforeContent, file.afterContent) }));
    return { scanned, risk: maxRisk(scanned.map((file) => file.risk)) };
  }, [draftFiles]);

  const pushEvent = (bundleId: string, action: string, detail: string) => {
    setEvents((current) => [{ id: `patch-diff-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), bundleId, action, detail }, ...current].slice(0, 180));
  };

  const updateDraftFile = (index: number, patch: Partial<Omit<PatchFile, 'id' | 'risk' | 'findings'>>) => {
    setDraftFiles((current) => current.map((file, idx) => idx === index ? { ...file, ...patch } : file));
  };

  const addDraftFile = () => setDraftFiles((current) => [...current, { ...emptyFile, path: `docs/SAFE_PATCH_${current.length + 1}.md` }]);
  const removeDraftFile = (index: number) => setDraftFiles((current) => current.length === 1 ? current : current.filter((_, idx) => idx !== index));

  const createBundle = () => {
    const files: PatchFile[] = draftFiles.map((file, index) => {
      const scan = scanFile(file.path, file.action, file.beforeContent, file.afterContent);
      return { id: `patch-file-${Date.now()}-${index}`, ...file, risk: scan.risk, findings: scan.findings };
    });
    const risk = maxRisk(files.map((file) => file.risk));
    const bundle: PatchBundle = {
      id: `patch-bundle-${Date.now()}`,
      title: draftMeta.title.trim() || 'Untitled multi-file patch',
      repo: draftMeta.repo.trim() || 'DVBCLUB/LedgerFlow-Studio',
      branchName: normalizeBranch(draftMeta.branchName),
      summary: draftMeta.summary.trim(),
      status: risk === 'BLOCKED' ? 'Blocked' : 'Draft',
      risk,
      createdAt: new Date().toLocaleString('vi-VN'),
      files
    };
    setBundles((current) => [bundle, ...current]);
    setSelectedId(bundle.id);
    setSelectedFileId(bundle.files[0]?.id ?? null);
    pushEvent(bundle.id, 'BUNDLE_CREATED', `Created ${files.length} file(s) with risk ${risk}.`);
  };

  const markReady = () => {
    if (!selected || selected.risk === 'BLOCKED') return;
    setBundles((current) => current.map((bundle) => bundle.id === selected.id ? { ...bundle, status: 'Ready' } : bundle));
    pushEvent(selected.id, 'BUNDLE_READY', 'Marked multi-file bundle ready for guarded handoff.');
  };

  const sendToReviewDesk = () => {
    if (!selected || selected.risk === 'BLOCKED') return;
    const reviewFiles = selected.files.filter((file) => file.action !== 'delete').map((file) => ({ path: file.path, content: file.afterContent }));
    localStorage.setItem('ledgerflow_review_desk_multifile_prefill_v1', JSON.stringify({
      sourcePatchBundleId: selected.id,
      title: selected.title,
      repo: selected.repo,
      branchName: selected.branchName,
      summary: `${selected.summary}\n\nPatch Bundle: ${selected.id}\nRisk: ${selected.risk}\nFiles: ${selected.files.map((file) => `${file.action}:${file.path}:${file.risk}`).join(', ')}`,
      files: reviewFiles
    }));
    localStorage.setItem('ledgerflow_review_desk_prefill_v1', JSON.stringify({
      sourcePatchBundleId: selected.id,
      title: selected.title,
      repo: selected.repo,
      branchName: selected.branchName,
      summary: `${selected.summary}\n\nMulti-file bundle stored in ledgerflow_review_desk_multifile_prefill_v1.\nBundle: ${selected.id}\nRisk: ${selected.risk}`,
      filePath: 'docs/MULTIFILE_PATCH_REVIEW.md',
      fileContent: `# ${selected.title}\n\n## Summary\n\n${selected.summary}\n\n## Files\n\n${selected.files.map((file) => `- ${file.action}: ${file.path} (${file.risk})`).join('\n')}\n`
    }));
    setBundles((current) => current.map((bundle) => bundle.id === selected.id ? { ...bundle, status: 'Sent' } : bundle));
    pushEvent(selected.id, 'SENT_TO_REVIEW_DESK', 'Stored multi-file bundle and opened Review Desk prefill.');
    window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill'));
    window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-multifile-prefill'));
    window.location.hash = '#/review_desk';
  };

  const removeSelected = () => {
    if (!selected) return;
    setBundles((current) => current.filter((bundle) => bundle.id !== selected.id));
    setSelectedId(null);
    setSelectedFileId(null);
  };

  return (
    <section className="rounded-3xl border border-fuchsia-400/35 bg-fuchsia-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200">Patch diff review center</p>
          <h3 className="mt-1 text-xl font-black text-white">Multi-file patch & diff an toàn</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Soạn nhiều file, quét risk từng file, xem diff nháp rồi mới chuyển qua Review Desk.</p>
        </div>
        <button onClick={() => exportJson('ledgerflow-patch-diff-review.json', { bundles, events })} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-fuchsia-300">Xuất diff log</button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Tạo multi-file bundle</p>
          <div className="mt-3 grid gap-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tiêu đề bundle" value={draftMeta.title} onChange={(event) => setDraftMeta({ ...draftMeta, title: event.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Repo" value={draftMeta.repo} onChange={(event) => setDraftMeta({ ...draftMeta, repo: event.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Branch ai/..." value={draftMeta.branchName} onChange={(event) => setDraftMeta({ ...draftMeta, branchName: event.target.value })} />
            <textarea className="min-h-[70px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Summary" value={draftMeta.summary} onChange={(event) => setDraftMeta({ ...draftMeta, summary: event.target.value })} />
          </div>

          <div className="mt-4 space-y-3">
            {draftFiles.map((file, index) => {
              const scan = draftScan.scanned[index];
              return <div key={index} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black text-white">File #{index + 1}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskClass(scan?.risk ?? 'LOW')}`}>{scan?.risk ?? 'LOW'}</span>
                </div>
                <div className="grid gap-2 md:grid-cols-[0.72fr_0.28fr]">
                  <input className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" placeholder="File path" value={file.path} onChange={(event) => updateDraftFile(index, { path: event.target.value })} />
                  <select className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" value={file.action} onChange={(event) => updateDraftFile(index, { action: event.target.value as FileAction })}>
                    <option value="create">create</option>
                    <option value="update">update</option>
                    <option value="delete">delete</option>
                  </select>
                </div>
                <textarea className="mt-2 min-h-[90px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-[11px] leading-5 text-slate-300" placeholder="Before content để xem diff" value={file.beforeContent} onChange={(event) => updateDraftFile(index, { beforeContent: event.target.value })} />
                <textarea className="mt-2 min-h-[120px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-[11px] leading-5 text-white" placeholder="After content" value={file.afterContent} onChange={(event) => updateDraftFile(index, { afterContent: event.target.value })} />
                {scan?.findings.length ? <p className="mt-2 text-[11px] font-bold text-rose-200">{scan.findings.join(' · ')}</p> : <p className="mt-2 text-[11px] font-bold text-emerald-200">No blocking findings</p>}
                <button onClick={() => removeDraftFile(index)} className="mt-2 rounded-full border border-rose-400/40 px-3 py-1 text-[10px] font-black text-rose-200 hover:bg-rose-400/10">Xóa file</button>
              </div>;
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={addDraftFile} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-fuchsia-300">Thêm file</button>
            <button onClick={createBundle} className="rounded-2xl bg-fuchsia-300 px-4 py-2 text-xs font-black text-slate-950">Tạo bundle</button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="grid gap-4 lg:grid-cols-[0.44fr_0.56fr]">
            <div>
              <p className="text-sm font-black text-white">Patch bundles</p>
              <div className="mt-3 space-y-2">
                {bundles.map((bundle) => <button key={bundle.id} onClick={() => { setSelectedId(bundle.id); setSelectedFileId(bundle.files[0]?.id ?? null); }} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === bundle.id ? 'border-fuchsia-300 bg-fuchsia-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-fuchsia-400/40'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-white">{bundle.title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(bundle.status)}`}>{bundle.status}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">{bundle.files.length} file(s) · {bundle.risk} · {bundle.createdAt}</p>
                </button>)}
                {bundles.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm font-semibold text-slate-400">Chưa có multi-file bundle nào.</p>}
              </div>
            </div>

            {selected && <div>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected bundle</p>
                  <h4 className="mt-1 text-lg font-black text-white">{selected.title}</h4>
                  <p className="mt-1 text-xs font-bold text-slate-400">{selected.branchName} · {selected.risk}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-black ${riskClass(selected.risk)}`}>{selected.risk}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {selected.files.map((file) => <button key={file.id} onClick={() => setSelectedFileId(file.id)} className={`rounded-full border px-3 py-1.5 text-[11px] font-black ${selectedFile?.id === file.id ? 'border-fuchsia-300 bg-fuchsia-400/10 text-fuchsia-100' : 'border-slate-700 text-slate-300 hover:border-fuchsia-300'}`}>{file.action}: {file.path}</button>)}
              </div>

              {selectedFile && <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black text-white">Diff preview: {selectedFile.path}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskClass(selectedFile.risk)}`}>{selectedFile.risk}</span>
                </div>
                <div className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/90 p-2 font-mono text-[11px] leading-5">
                  {diffRows.map((row) => <pre key={`${row.index}-${row.type}`} className={`${row.type === 'add' ? 'text-emerald-200' : row.type === 'remove' ? 'text-rose-200' : row.type === 'change' ? 'text-amber-200' : 'text-slate-500'}`}>{row.type === 'add' ? '+ ' : row.type === 'remove' ? '- ' : row.type === 'change' ? '' : '  '}{row.line || ' '}</pre>)}
                </div>
                {selectedFile.findings.length ? <p className="mt-2 text-[11px] font-bold text-rose-200">{selectedFile.findings.join(' · ')}</p> : <p className="mt-2 text-[11px] font-bold text-emerald-200">No blocking findings</p>}
              </div>}

              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={markReady} disabled={selected.risk === 'BLOCKED'} className="rounded-2xl border border-cyan-400/40 px-4 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50">Mark ready</button>
                <button onClick={sendToReviewDesk} disabled={selected.risk === 'BLOCKED'} className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50">Đưa sang Review Desk</button>
                <button onClick={removeSelected} className="rounded-2xl border border-rose-400/40 px-4 py-2 text-xs font-black text-rose-200 hover:bg-rose-400/10">Xóa bundle</button>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Bundle events</p>
                <div className="mt-2 max-h-32 space-y-2 overflow-y-auto">
                  {selectedEvents.map((event) => <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                    <p className="text-[10px] font-black text-fuchsia-200">{event.action}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">{event.detail}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-600">{event.at}</p>
                  </div>)}
                </div>
              </div>
            </div>}
          </div>
        </div>
      </div>
    </section>
  );
}
