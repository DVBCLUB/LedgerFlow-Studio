import React, { useMemo, useRef, useState } from 'react';
import { Download, Upload, RotateCcw } from 'lucide-react';

const BACKUP_KEYS = [
  'ledgerflow-persona-interviews-v1',
  'ledgerflow-distribution-leads-v1',
  'ledgerflow-experiment-decisions-v1',
  'ledgerflow-tool-budget-ledger-v1',
  'ledgerflow-weekly-action-planner-v1',
  'ledgerflow-daily-founder-standup-v1',
  'ledgerflow-ai-staff-assignment-v1',
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
  'ledgerflow-learning-path-builder-v1'
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

export default function LabsBackupRestore() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState('');

  const stats = useMemo(() => BACKUP_KEYS.map((key) => {
    const data = safeParse(localStorage.getItem(key));
    return { key, count: Array.isArray(data) ? data.length : data ? 1 : 0 };
  }), [message]);

  const exportBackup = () => {
    const payload: BackupPayload = {
      app: 'LedgerFlow Studio',
      type: 'founder-labs-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
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
    setMessage('Đã xuất file backup JSON cho Founder Labs.');
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as BackupPayload;
      if (payload.app !== 'LedgerFlow Studio' || payload.type !== 'founder-labs-backup' || !payload.keys) {
        setMessage('File không đúng định dạng backup Founder Labs.');
        return;
      }
      BACKUP_KEYS.forEach((key) => {
        if (key in payload.keys) {
          const value = payload.keys[key];
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value ?? []));
        }
      });
      setMessage('Đã nhập backup. Tải lại trang để các lab đọc dữ liệu mới nhất.');
    } catch (error) {
      setMessage('Không nhập được file. Kiểm tra lại JSON backup.');
    }
  };

  const resetLabs = () => {
    const yes = window.confirm('Xóa dữ liệu localStorage của Founder Labs gồm interview, lead, decision, tool budget, weekly planner, daily standup, AI staff board, content board, synthetic survey, A/B simulation, MoR readiness, automation blueprint, moat tracker, pricing offer, product launch và learning path?');
    if (!yes) return;
    BACKUP_KEYS.forEach((key) => localStorage.removeItem(key));
    setMessage('Đã xóa dữ liệu Founder Labs trên trình duyệt này.');
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Backup / Restore</p>
        <h2 className="mt-2 text-xl font-black text-white">Sao lưu dữ liệu Founder Labs</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Xuất và nhập dữ liệu phỏng vấn persona, lead board, decision log, tool budget, weekly planner, daily standup, AI staff board, content board, synthetic survey, A/B simulation, MoR readiness, automation blueprint, moat tracker, pricing offer, product launch và learning path. Dữ liệu này nằm trong localStorage của trình duyệt, nên cần backup trước khi đổi máy, clear cache hoặc deploy bản mới.
        </p>
      </div>

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
