import { useEffect, useMemo, useState } from 'react';

type HandoffStatus = 'Draft' | 'Ready' | 'Sent' | 'Done' | 'Blocked';
type HandoffTarget = 'VS Code' | 'Cursor' | 'Manual Patch' | 'GitHub Review Desk';

type HandoffItem = {
  id: string;
  title: string;
  target: HandoffTarget;
  status: HandoffStatus;
  source: string;
  patchBundleId?: string;
  prompt: string;
  checklist: string[];
  commands: string[];
  notes: string;
  createdAt: string;
};

const STORAGE_KEY = 'ledgerflow_local_handoff_items_v1';
const EVENT_KEY = 'ledgerflow_local_handoff_events_v1';

const defaultItems: HandoffItem[] = [
  {
    id: 'handoff-safe-vscode-001',
    title: 'Safe local handoff for AI patch review',
    target: 'VS Code',
    status: 'Draft',
    source: 'system-default',
    prompt: 'Open the generated patch bundle, review diff, run manual build/test commands, and do not commit secrets or runtime-only files.',
    checklist: [
      'Mở patch trong VS Code/Cursor để review thủ công.',
      'Kiểm tra không có file runtime/private/local-only.',
      'Chạy test/build thủ công nếu cần.',
      'Đưa patch sạch sang Review Desk để tạo Draft PR.',
    ],
    commands: ['npm install', 'npm run build'],
    notes: 'Commands are suggestions only. The app must not run terminal automatically.',
    createdAt: 'Mặc định',
  },
];

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

function exportText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildPrompt(item: HandoffItem) {
  return [
    `# ${item.title}`,
    '',
    `Target: ${item.target}`,
    `Source: ${item.source}`,
    item.patchBundleId ? `Patch bundle: ${item.patchBundleId}` : '',
    '',
    '## Prompt',
    item.prompt,
    '',
    '## Checklist',
    ...item.checklist.map((line, index) => `${index + 1}. ${line}`),
    '',
    '## Suggested manual commands',
    ...item.commands.map((line) => `- ${line}`),
    '',
    '## Safety',
    '- Manual-only handoff: do not run shell automatically.',
    '- Do not commit local runtime files or private config.',
    '- Final GitHub write must still go through Review Desk approval.',
    '',
    '## Notes',
    item.notes,
  ].filter(Boolean).join('\n');
}

export default function LocalHandoffCenter() {
  const [items, setItems] = useState<HandoffItem[]>(() => readLocal(STORAGE_KEY, defaultItems));
  const [selectedId, setSelectedId] = useState(() => readLocal(STORAGE_KEY, defaultItems)[0]?.id ?? defaultItems[0].id);
  const [draft, setDraft] = useState({ title: '', target: 'VS Code' as HandoffTarget, source: 'AI Ops', prompt: '', commands: 'npm run build' });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId]);

  const logEvent = (action: string, detail: string) => {
    const events = readLocal<any[]>(EVENT_KEY, []);
    localStorage.setItem(EVENT_KEY, JSON.stringify([{ id: `handoff-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action, detail }, ...events].slice(0, 120)));
    window.dispatchEvent(new CustomEvent('ledgerflow-local-handoff-updated'));
  };

  const createItem = () => {
    if (!draft.title.trim() || !draft.prompt.trim()) return;
    const item: HandoffItem = {
      id: `handoff-${Date.now()}`,
      title: draft.title.trim(),
      target: draft.target,
      status: 'Draft',
      source: draft.source.trim() || 'AI Ops',
      prompt: draft.prompt.trim(),
      checklist: ['Review diff manually', 'Run manual build/test if needed', 'Send clean patch to Review Desk'],
      commands: draft.commands.split('\n').map((line) => line.trim()).filter(Boolean),
      notes: 'Manual handoff only. No automatic terminal execution.',
      createdAt: new Date().toLocaleString('vi-VN'),
    };
    setItems((current) => [item, ...current]);
    setSelectedId(item.id);
    setDraft({ ...draft, title: '', prompt: '' });
    logEvent('HANDOFF_CREATED', `Created local handoff ${item.title}.`);
  };

  const importFromDiffReview = () => {
    const bundle = readLocal<any>('ledgerflow_review_desk_multifile_prefill_v1', null);
    if (!bundle) return;
    const item: HandoffItem = {
      id: `handoff-bundle-${Date.now()}`,
      title: bundle.title || 'Review multi-file patch locally',
      target: 'VS Code',
      status: 'Ready',
      source: 'Diff Review',
      patchBundleId: bundle.sourceBundleId,
      prompt: `Review this multi-file bundle locally before Review Desk. Summary: ${bundle.summary || ''}`,
      checklist: ['Open file list', 'Check affected modules', 'Run manual build/test', 'Return to Review Desk for one approval'],
      commands: ['npm run build'],
      notes: `Files: ${Array.isArray(bundle.files) ? bundle.files.map((file: any) => file.path).join(', ') : 'unknown'}`,
      createdAt: new Date().toLocaleString('vi-VN'),
    };
    setItems((current) => [item, ...current]);
    setSelectedId(item.id);
    logEvent('HANDOFF_IMPORTED_FROM_DIFF', `Imported bundle ${item.patchBundleId || 'unknown'} for local handoff.`);
  };

  const updateStatus = (status: HandoffStatus) => {
    if (!selected) return;
    setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status } : item));
    logEvent('HANDOFF_STATUS_CHANGED', `${selected.title} -> ${status}`);
  };

  const sendToReviewDesk = () => {
    if (!selected) return;
    localStorage.setItem('ledgerflow_review_desk_prefill_v1', JSON.stringify({
      title: selected.title,
      branchName: `ai/${selected.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 42) || 'local-handoff'}`,
      summary: `${selected.prompt}\n\nLocal handoff target: ${selected.target}\nStatus: ${selected.status}\n\nChecklist:\n${selected.checklist.map((line) => `- ${line}`).join('\n')}`,
      filePath: 'docs/LOCAL_HANDOFF_NOTES.md',
      fileContent: buildPrompt(selected),
    }));
    updateStatus('Sent');
    window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill'));
    window.location.hash = '#/review_desk';
  };

  return (
    <section className="rounded-3xl border border-lime-400/30 bg-lime-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-200">Local handoff</p>
          <h3 className="mt-1 text-xl font-black text-white">VS Code / Cursor handoff an toàn</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Xuất prompt, checklist và patch bundle cho local review. Không tự chạy terminal, không tự sửa file máy.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={importFromDiffReview} className="rounded-2xl bg-lime-300 px-4 py-2 text-xs font-black text-slate-950">Import Diff bundle</button>
          <button onClick={() => exportJson('ledgerflow-local-handoff.json', items)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-lime-300">Xuất JSON</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Tạo handoff mới</p>
          <div className="mt-3 grid gap-2">
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Tên handoff" className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <select value={draft.target} onChange={(event) => setDraft({ ...draft, target: event.target.value as HandoffTarget })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
              {(['VS Code', 'Cursor', 'Manual Patch', 'GitHub Review Desk'] as HandoffTarget[]).map((target) => <option key={target}>{target}</option>)}
            </select>
            <textarea value={draft.prompt} onChange={(event) => setDraft({ ...draft, prompt: event.target.value })} placeholder="Prompt / mục tiêu local review" className="min-h-[100px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" />
            <textarea value={draft.commands} onChange={(event) => setDraft({ ...draft, commands: event.target.value })} placeholder="Lệnh thủ công gợi ý, mỗi dòng một lệnh" className="min-h-[76px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" />
            <button onClick={createItem} className="rounded-2xl bg-lime-300 px-4 py-2 text-xs font-black text-slate-950">Tạo handoff</button>
          </div>

          <div className="mt-4 space-y-2">
            {items.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === item.id ? 'border-lime-300 bg-lime-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-lime-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{item.title}</p>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{item.status}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-500">{item.target} · {item.source}</p>
            </button>)}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected handoff</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.title}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.target} · {selected.source} · {selected.createdAt}</p>
            </div>
            <span className="rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-xs font-black text-lime-200">{selected.status}</span>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Prompt export</p>
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs font-semibold leading-6 text-slate-300">{buildPrompt(selected)}</pre>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(['Ready', 'Sent', 'Done', 'Blocked'] as HandoffStatus[]).map((status) => <button key={status} onClick={() => updateStatus(status)} className="rounded-full border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-lime-300">{status}</button>)}
            <button onClick={() => exportText('ledgerflow-local-handoff.md', buildPrompt(selected))} className="rounded-2xl border border-lime-400/40 px-4 py-2 text-xs font-black text-lime-200 hover:bg-lime-400/10">Xuất prompt MD</button>
            <button onClick={sendToReviewDesk} className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Đưa sang Review Desk</button>
          </div>
        </div>}
      </div>
    </section>
  );
}
