import { useEffect, useState } from 'react';

type RecoveryItem = {
  id: string;
  at: string;
  repo?: string;
  branch?: string;
  prNumber?: number | null;
  prUrl?: string | null;
  runUrl?: string | null;
  workflowName?: string | null;
  conclusion?: string | null;
  prompt?: string;
  status: 'Open' | 'Investigating' | 'Ready for patch' | 'Resolved';
};

function readQueue(): RecoveryItem[] {
  try {
    const raw = localStorage.getItem('ledgerflow_ci_recovery_queue_v1');
    return raw ? JSON.parse(raw) as RecoveryItem[] : [];
  } catch {
    return [];
  }
}

function readLatestPackage(): Partial<RecoveryItem> | null {
  try {
    const raw = localStorage.getItem('ledgerflow_ci_fix_package_v1');
    return raw ? JSON.parse(raw) as Partial<RecoveryItem> : null;
  } catch {
    return null;
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

export default function CIRecoveryQueue() {
  const [items, setItems] = useState<RecoveryItem[]>(() => readQueue());
  const [selectedId, setSelectedId] = useState<string | null>(() => readQueue()[0]?.id ?? null);

  useEffect(() => {
    localStorage.setItem('ledgerflow_ci_recovery_queue_v1', JSON.stringify(items));
  }, [items]);

  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  const importLatest = () => {
    const latest = readLatestPackage();
    if (!latest) return;
    const id = `ci-${latest.prNumber ?? 'unknown'}-${latest.branch ?? 'branch'}-${Date.now()}`;
    const item: RecoveryItem = {
      id,
      at: new Date().toLocaleString('vi-VN'),
      repo: latest.repo,
      branch: latest.branch,
      prNumber: latest.prNumber ?? null,
      prUrl: latest.prUrl ?? null,
      runUrl: latest.runUrl ?? null,
      workflowName: latest.workflowName ?? null,
      conclusion: latest.conclusion ?? null,
      prompt: latest.prompt ?? 'Phân tích lỗi CI và đề xuất patch nhỏ nhất.',
      status: 'Open'
    };
    setItems((current) => [item, ...current.filter((old) => !(old.prNumber === item.prNumber && old.branch === item.branch))]);
    setSelectedId(id);
  };

  const updateStatus = (status: RecoveryItem['status']) => {
    if (!selected) return;
    setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status } : item));
  };

  const removeSelected = () => {
    if (!selected) return;
    setItems((current) => current.filter((item) => item.id !== selected.id));
    setSelectedId(null);
  };

  const openCiDoctor = () => { window.location.hash = '#/ci_doctor'; };
  const openReviewDesk = () => { window.location.hash = '#/review_desk'; };

  return (
    <section className="rounded-3xl border border-amber-400/35 bg-amber-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">CI recovery queue</p>
          <h3 className="mt-1 text-xl font-black text-white">Hàng chờ sửa lỗi build</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Gom lỗi CI từ Review Desk để AI Code/CI Doctor xử lý tiếp, tránh lỗi build bị rơi mất.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={importLatest} className="rounded-2xl bg-amber-300 px-4 py-2 text-xs font-black text-slate-950">Nhập lỗi CI mới nhất</button>
          <button onClick={() => exportJson('ledgerflow-ci-recovery-queue.json', items)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-amber-300">Xuất queue</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-2 rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          {items.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === item.id ? 'border-amber-300 bg-amber-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-amber-400/40'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-white">PR #{item.prNumber ?? '?'} · {item.branch ?? 'unknown branch'}</p>
              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{item.status}</span>
            </div>
            <p className="mt-1 text-[11px] font-bold text-slate-400">{item.workflowName ?? 'workflow'} · {item.conclusion ?? 'unknown'} · {item.at}</p>
          </button>)}
          {items.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm font-semibold text-slate-400">Chưa có lỗi CI nào trong queue. Bấm Check PR/CI ở Review Desk; nếu workflow đỏ thì nhập vào đây.</p>}
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected CI failure</p>
              <h4 className="mt-1 text-lg font-black text-white">PR #{selected.prNumber ?? '?'} · {selected.branch ?? 'unknown branch'}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.repo ?? 'repo'} · {selected.workflowName ?? 'workflow'} · {selected.conclusion ?? 'unknown'}</p>
            </div>
            <span className="rounded-full border border-amber-400/35 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-200">{selected.status}</span>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {selected.prUrl && <a className="rounded-2xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-300 hover:border-emerald-300" href={selected.prUrl} target="_blank" rel="noreferrer">Mở PR</a>}
            {selected.runUrl && <a className="rounded-2xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-300 hover:border-amber-300" href={selected.runUrl} target="_blank" rel="noreferrer">Mở workflow run</a>}
            <button onClick={openCiDoctor} className="rounded-2xl border border-violet-400/40 px-3 py-2 text-xs font-black text-violet-200 hover:bg-violet-400/10">Mở CI Doctor</button>
            <button onClick={openReviewDesk} className="rounded-2xl border border-emerald-400/40 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Mở Review Desk</button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Prompt cho AI Code / CI Doctor</p>
            <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-6 text-slate-300">{selected.prompt}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(['Open', 'Investigating', 'Ready for patch', 'Resolved'] as RecoveryItem['status'][]).map((status) => <button key={status} onClick={() => updateStatus(status)} className={`rounded-full border px-3 py-2 text-[11px] font-black ${selected.status === status ? 'border-emerald-300 bg-emerald-300 text-slate-950' : 'border-slate-700 text-slate-300 hover:border-emerald-400'}`}>{status}</button>)}
            <button onClick={removeSelected} className="rounded-full border border-rose-400/40 px-3 py-2 text-[11px] font-black text-rose-200 hover:bg-rose-400/10">Xóa</button>
          </div>
        </div>}
      </div>
    </section>
  );
}
