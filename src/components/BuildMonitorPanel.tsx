import { useEffect, useState } from 'react';

type BuildRecord = {
  id: string;
  at: string;
  repo: string;
  branch: string;
  source: 'Manual' | 'Review Desk' | 'AI Ops';
  status: 'Unknown' | 'Queued' | 'Running' | 'Success' | 'Failed';
  notes: string;
  runUrl?: string | null;
  artifactName?: string | null;
};

const defaultRecords: BuildRecord[] = [
  {
    id: 'build-default',
    at: 'Mặc định',
    repo: 'DVBCLUB/LedgerFlow-Studio',
    branch: 'main',
    source: 'AI Ops',
    status: 'Unknown',
    notes: 'Theo dõi build sau mỗi lần AI tạo PR hoặc cập nhật main. Khi workflow xanh, tải artifact LedgerFlow-Hub-Windows-Download để test bản desktop.',
    artifactName: 'LedgerFlow-Hub-Windows-Download'
  }
];

function readRecords(): BuildRecord[] {
  try {
    const raw = localStorage.getItem('ledgerflow_build_monitor_v1');
    return raw ? JSON.parse(raw) as BuildRecord[] : defaultRecords;
  } catch {
    return defaultRecords;
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

function statusClass(status: BuildRecord['status']) {
  if (status === 'Success') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (status === 'Failed') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  if (status === 'Running') return 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200';
  if (status === 'Queued') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  return 'border-slate-700 bg-slate-950 text-slate-300';
}

export default function BuildMonitorPanel() {
  const [records, setRecords] = useState<BuildRecord[]>(() => readRecords());
  const [draft, setDraft] = useState({ repo: 'DVBCLUB/LedgerFlow-Studio', branch: 'main', status: 'Unknown' as BuildRecord['status'], notes: '', runUrl: '', artifactName: 'LedgerFlow-Hub-Windows-Download' });
  const [selectedId, setSelectedId] = useState(records[0]?.id ?? '');

  useEffect(() => {
    localStorage.setItem('ledgerflow_build_monitor_v1', JSON.stringify(records));
  }, [records]);

  const selected = records.find((record) => record.id === selectedId) ?? records[0];

  const addRecord = () => {
    const record: BuildRecord = {
      id: `build-${Date.now()}`,
      at: new Date().toLocaleString('vi-VN'),
      repo: draft.repo.trim() || 'DVBCLUB/LedgerFlow-Studio',
      branch: draft.branch.trim() || 'main',
      source: 'Manual',
      status: draft.status,
      notes: draft.notes.trim() || 'Theo dõi build/artifact sau lần cập nhật này.',
      runUrl: draft.runUrl.trim() || null,
      artifactName: draft.artifactName.trim() || null
    };
    setRecords((current) => [record, ...current]);
    setSelectedId(record.id);
    setDraft({ ...draft, notes: '', runUrl: '' });
  };

  const updateSelected = (status: BuildRecord['status']) => {
    if (!selected) return;
    setRecords((current) => current.map((record) => record.id === selected.id ? { ...record, status } : record));
  };

  const removeSelected = () => {
    if (!selected) return;
    setRecords((current) => current.filter((record) => record.id !== selected.id));
    setSelectedId('');
  };

  return (
    <section className="rounded-3xl border border-cyan-400/35 bg-cyan-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Build monitor</p>
          <h3 className="mt-1 text-xl font-black text-white">Theo dõi build & artifact</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Nơi ghi lại trạng thái build sau khi AI push branch/PR hoặc cập nhật main. Mục tiêu là không quên bước tải artifact và test app desktop.</p>
        </div>
        <button onClick={() => exportJson('ledgerflow-build-monitor.json', records)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300">Xuất build log</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Thêm lần build cần theo dõi</p>
          <div className="mt-3 grid gap-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Repo" value={draft.repo} onChange={(event) => setDraft({ ...draft, repo: event.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Branch" value={draft.branch} onChange={(event) => setDraft({ ...draft, branch: event.target.value })} />
            <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as BuildRecord['status'] })}>
              {['Unknown', 'Queued', 'Running', 'Success', 'Failed'].map((status) => <option key={status}>{status}</option>)}
            </select>
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Artifact name" value={draft.artifactName} onChange={(event) => setDraft({ ...draft, artifactName: event.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Workflow run URL nếu có" value={draft.runUrl} onChange={(event) => setDraft({ ...draft, runUrl: event.target.value })} />
            <textarea className="min-h-[110px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Ghi chú test/build..." value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
            <button onClick={addRecord} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950">Thêm vào Build Monitor</button>
          </div>

          <div className="mt-4 space-y-2">
            {records.map((record) => <button key={record.id} onClick={() => setSelectedId(record.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === record.id ? 'border-cyan-300 bg-cyan-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-cyan-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{record.branch}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(record.status)}`}>{record.status}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-400">{record.repo} · {record.at}</p>
            </button>)}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected build</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.repo} · {selected.branch}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.source} · {selected.at}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(selected.status)}`}>{selected.status}</span>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ghi chú</p>
            <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-6 text-slate-300">{selected.notes}</p>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {selected.runUrl && <a className="rounded-2xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-300 hover:border-cyan-300" href={selected.runUrl} target="_blank" rel="noreferrer">Mở workflow run</a>}
            {selected.artifactName && <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300">Artifact: <span className="font-black text-cyan-200">{selected.artifactName}</span></div>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(['Unknown', 'Queued', 'Running', 'Success', 'Failed'] as BuildRecord['status'][]).map((status) => <button key={status} onClick={() => updateSelected(status)} className={`rounded-full border px-3 py-2 text-[11px] font-black ${selected.status === status ? 'border-emerald-300 bg-emerald-300 text-slate-950' : 'border-slate-700 text-slate-300 hover:border-emerald-400'}`}>{status}</button>)}
            <button onClick={removeSelected} className="rounded-full border border-rose-400/40 px-3 py-2 text-[11px] font-black text-rose-200 hover:bg-rose-400/10">Xóa</button>
          </div>
        </div>}
      </div>
    </section>
  );
}
