import React, { useMemo, useRef, useState } from 'react';
import { Download, Upload, RotateCcw, ShieldAlert } from 'lucide-react';

const BACKUP_META_KEY = 'ledgerflow-founder-labs-last-backup-v1';

const BACKUP_KEYS = [
  'ledgerflow-persona-interviews-v1',
  'ledgerflow-distribution-leads-v1',
  'ledgerflow-experiment-decisions-v1',
  'ledgerflow-tool-budget-ledger-v1',
  'ledgerflow-weekly-action-planner-v1',
  'ledgerflow-daily-founder-standup-v1',
  'ledgerflow-ai-staff-assignment-v1',
  'ledgerflow-ai-output-quality-review-v1',
  'ledgerflow-content-repurpose-board-v1',
  'ledgerflow-synthetic-survey-builder-v1',
  'ledgerflow-ab-simulation-lab-v1',
  'ledgerflow-mor-readiness-checklist-v1',
  'ledgerflow-payment-path-v1',
  'ledgerflow-n8n-automation-blueprint-v1',
  'ledgerflow-moat-defensibility-tracker-v1',
  'ledgerflow-pricing-offer-builder-v1',
  'ledgerflow-product-launch-checklist-v1',
  'ledgerflow-product-launch-mode-v1',
  'ledgerflow-learning-path-builder-v1',
  'ledgerflow-game-library-v1',
  'ledgerflow-audit-red-flag-game-v1',
  'ledgerflow-cash-runway-game-v1',
  'ledgerflow-pmf-decision-game-v1',
  'ledgerflow-document-matching-game-v1',
  'ledgerflow-cost-flow-game-v1',
  'ledgerflow-game-session-history-v1'
];

type BackupPayload = {
  app: 'LedgerFlow Studio';
  type: 'founder-labs-backup';
  version: 1;
  exportedAt: string;
  keys: Record<string, unknown>;
};

function safeParse(value: string | null) {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function formatDateTime(value: string | null) {
  if (!value) return 'Chưa có backup';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}

export default function LabsBackupRestore() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState('');
  const [lastBackupAt, setLastBackupAt] = useState(() => localStorage.getItem(BACKUP_META_KEY));

  const stats = useMemo(() => BACKUP_KEYS.map((key) => {
    const data = safeParse(localStorage.getItem(key));
    return { key, count: Array.isArray(data) ? data.length : data ? 1 : 0 };
  }), [message, lastBackupAt]);

  const totalRecords = useMemo(() => stats.reduce((sum, item) => sum + item.count, 0), [stats]);
  const hasDataWithoutBackup = totalRecords > 0 && !lastBackupAt;

  const exportBackup = () => {
    const exportedAt = new Date().toISOString();
    const payload: BackupPayload = {
      app: 'LedgerFlow Studio',
      type: 'founder-labs-backup',
      version: 1,
      exportedAt,
      keys: {}
    };

    BACKUP_KEYS.forEach((key) => {
      payload.keys[key] = safeParse(localStorage.getItem(key));
    });

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledgerflow-founder-labs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem(BACKUP_META_KEY, exportedAt);
    setLastBackupAt(exportedAt);
    setMessage('Đã xuất file backup JSON cho Founder Labs. Hãy lưu file này ngoài thư mục app để dùng khi đổi máy hoặc cài bản mới.');
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as BackupPayload;
      if (payload.app !== 'LedgerFlow Studio' || payload.type !== 'founder-labs-backup' || payload.version !== 1 || !payload.keys) {
        setMessage('File không đúng định dạng backup Founder Labs hoặc khác version. Không nhập để tránh ghi sai dữ liệu.');
        return;
      }
      BACKUP_KEYS.forEach((key) => {
        if (key in payload.keys) {
          const value = payload.keys[key];
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value ?? []));
        }
      });
      localStorage.setItem(BACKUP_META_KEY, payload.exportedAt);
      setLastBackupAt(payload.exportedAt);
      setMessage('Đã nhập backup. Tải lại trang để các lab đọc dữ liệu mới nhất.');
    } catch (error) {
      setMessage('Không nhập được file. Kiểm tra lại JSON backup.');
    }
  };

  const resetLabs = () => {
    const yes = window.confirm('Xóa dữ liệu localStorage của Founder Labs gồm interview, lead, decision, tool budget, planner, AI review, content, survey, launch, learning path, game library, các game playable và lịch sử chơi game? Nên xuất backup trước khi reset.');
    if (!yes) return;
    BACKUP_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(BACKUP_META_KEY);
    setLastBackupAt(null);
    setMessage('Đã xóa dữ liệu Founder Labs trên trình duyệt này.');
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Backup / Restore</p>
        <h2 className="mt-2 text-xl font-black text-white">Sao lưu dữ liệu Founder Labs</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Xuất và nhập dữ liệu Founder Labs, gồm phỏng vấn, lead, decision, tool budget, launch, learning path, game library, các game playable và lịch sử chơi game. Dữ liệu này nằm trong localStorage của trình duyệt, nên cần backup trước khi đổi máy, clear cache hoặc deploy bản mới.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-[10px] font-black uppercase text-emerald-200">Tổng bản ghi</p>
          <p className="mt-2 text-3xl font-black text-emerald-200">{totalRecords}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-100/80">trong {BACKUP_KEYS.length} storage keys</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 md:col-span-2">
          <p className="text-[10px] font-black uppercase text-cyan-200">Backup gần nhất</p>
          <p className="mt-2 text-lg font-black text-white">{formatDateTime(lastBackupAt)}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-cyan-100/80">Nên xuất backup trước khi cài bản mới, clear cache, đổi trình duyệt hoặc đổi máy.</p>
        </div>
      </div>

      {hasDataWithoutBackup && (
        <div className="flex items-start gap-3 rounded-3xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-black">Bạn có dữ liệu nhưng chưa ghi nhận lần backup nào.</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-amber-100/80">Hãy bấm Xuất backup JSON và lưu file ngoài thư mục app trước khi update hoặc build bản mới.</p>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {stats.map((item) => (
          <div key={item.key} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-[10px] font-black uppercase text-slate-500">Local key</p>
            <p className="mt-2 break-all text-xs font-black text-white">{item.key}</p>
            <p className="mt-3 text-2xl font-black text-emerald-300">{item.count}</p>
            <p className="text-[11px] font-semibold text-slate-400">bản ghi hiện có</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <button onClick={exportBackup} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 hover:bg-emerald-300">
          <Download className="h-4 w-4" /> Xuất backup JSON
        </button>
        <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-xs font-black text-cyan-200 hover:bg-cyan-500/20">
          <Upload className="h-4 w-4" /> Nhập backup JSON
        </button>
        <button onClick={resetLabs} className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-black text-rose-200 hover:bg-rose-500/20">
          <RotateCcw className="h-4 w-4" /> Reset dữ liệu lab
        </button>
        <input ref={inputRef} type="file" accept="application/json" className="hidden" onChange={(event) => importBackup(event.target.files?.[0])} />
      </div>

      {message && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">{message}</div>}
    </section>
  );
}
