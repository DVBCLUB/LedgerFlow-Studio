import React, { useMemo, useState } from 'react';

type StandupStatus = 'On track' | 'Blocked' | 'Need AI help' | 'Low energy';

type StandupEntry = {
  id: string;
  date: string;
  todayFocus: string;
  blocker: string;
  aiHelpNeeded: string;
  energy: number;
  status: StandupStatus;
  nextTinyStep: string;
};

const STORAGE_KEY = 'ledgerflow-daily-founder-standup-v1';

const todayText = () => new Date().toISOString().slice(0, 10);

const loadEntries = (): StandupEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const seedEntries: StandupEntry[] = [
  {
    id: 'demo-standup-1',
    date: todayText(),
    todayFocus: 'Chạy 1 demo nhỏ cho Persona Interview Lab và ghi paid signal.',
    blocker: 'Chưa chọn đúng persona ưu tiên.',
    aiHelpNeeded: 'AI Research Lead gợi ý 5 câu hỏi phỏng vấn ngắn.',
    energy: 7,
    status: 'Need AI help',
    nextTinyStep: 'Chọn 1 persona và đặt 3 câu hỏi trước khi mở rộng scope.'
  }
];

const saveEntries = (entries: StandupEntry[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

export default function DailyFounderStandup() {
  const [entries, setEntries] = useState<StandupEntry[]>(() => {
    const loaded = loadEntries();
    return loaded.length ? loaded : seedEntries;
  });
  const [form, setForm] = useState({
    date: todayText(),
    todayFocus: '',
    blocker: '',
    aiHelpNeeded: '',
    energy: 7,
    status: 'On track' as StandupStatus,
    nextTinyStep: ''
  });

  const stats = useMemo(() => {
    const total = entries.length;
    const blocked = entries.filter((item) => item.status === 'Blocked').length;
    const needAI = entries.filter((item) => item.status === 'Need AI help').length;
    const avgEnergy = total ? entries.reduce((sum, item) => sum + Number(item.energy || 0), 0) / total : 0;
    const today = entries.find((item) => item.date === todayText());
    return { total, blocked, needAI, avgEnergy, today };
  }, [entries]);

  const persist = (next: StandupEntry[]) => {
    setEntries(next);
    saveEntries(next);
  };

  const addEntry = () => {
    if (!form.todayFocus.trim()) return;
    const next: StandupEntry = {
      id: `standup-${Date.now()}`,
      date: form.date,
      todayFocus: form.todayFocus.trim(),
      blocker: form.blocker.trim() || 'Không có blocker rõ.',
      aiHelpNeeded: form.aiHelpNeeded.trim() || 'Chưa cần AI hỗ trợ.',
      energy: Number(form.energy),
      status: form.status,
      nextTinyStep: form.nextTinyStep.trim() || 'Chọn một bước nhỏ có thể làm trong 15 phút.'
    };
    persist([next, ...entries]);
    setForm({ date: todayText(), todayFocus: '', blocker: '', aiHelpNeeded: '', energy: 7, status: 'On track', nextTinyStep: '' });
  };

  const removeEntry = (id: string) => persist(entries.filter((item) => item.id !== id));

  const clearDemo = () => persist([]);

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Daily Standup</p>
        <h2 className="mt-2 text-xl font-black text-white">Nhật ký founder hằng ngày</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Mỗi ngày ghi 1 dòng: hôm nay tập trung gì, bị kẹt gì, cần AI nào hỗ trợ và bước nhỏ kế tiếp. Mục tiêu là chống build lan man và giữ nhịp vận hành.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Tổng standup</p><p className="mt-2 text-3xl font-black text-white">{stats.total}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Blocked</p><p className="mt-2 text-3xl font-black text-rose-300">{stats.blocked}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Need AI help</p><p className="mt-2 text-3xl font-black text-cyan-300">{stats.needAI}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Energy avg</p><p className="mt-2 text-3xl font-black text-emerald-300">{stats.avgEnergy.toFixed(1)}/10</p></div>
      </div>

      {stats.today && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
          <p className="text-[10px] font-black uppercase text-emerald-300">Hôm nay đã có standup</p>
          <p className="mt-2 text-sm font-black text-white">{stats.today.todayFocus}</p>
          <p className="mt-2 text-xs font-semibold leading-6 text-emerald-100">Bước nhỏ kế tiếp: {stats.today.nextTinyStep}</p>
        </div>
      )}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <h3 className="text-sm font-black text-white">Ghi standup mới</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StandupStatus })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100">
            {['On track', 'Blocked', 'Need AI help', 'Low energy'].map((status) => <option key={status}>{status}</option>)}
          </select>
          <input value={form.todayFocus} onChange={(e) => setForm({ ...form, todayFocus: e.target.value })} placeholder="Hôm nay tập trung việc gì?" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 md:col-span-2" />
          <input value={form.blocker} onChange={(e) => setForm({ ...form, blocker: e.target.value })} placeholder="Đang kẹt gì?" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100" />
          <input value={form.aiHelpNeeded} onChange={(e) => setForm({ ...form, aiHelpNeeded: e.target.value })} placeholder="Cần AI nào hỗ trợ gì?" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100" />
          <input value={form.nextTinyStep} onChange={(e) => setForm({ ...form, nextTinyStep: e.target.value })} placeholder="Bước nhỏ kế tiếp là gì?" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100" />
          <label className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-300">Energy: {form.energy}/10<input type="range" min="1" max="10" value={form.energy} onChange={(e) => setForm({ ...form, energy: Number(e.target.value) })} className="mt-2 w-full" /></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={addEntry} className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300">Lưu standup</button>
          <button onClick={clearDemo} className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:text-white">Xóa toàn bộ</button>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{entry.date}</span>
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black text-cyan-200">{entry.status}</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-200">Energy {entry.energy}/10</span>
                </div>
                <h3 className="mt-3 text-sm font-black text-white">{entry.todayFocus}</h3>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">Blocker: {entry.blocker}</p>
                <p className="text-xs font-semibold leading-6 text-slate-400">AI help: {entry.aiHelpNeeded}</p>
                <p className="text-xs font-semibold leading-6 text-emerald-200">Next tiny step: {entry.nextTinyStep}</p>
              </div>
              <button onClick={() => removeEntry(entry.id)} className="rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-black text-rose-300 hover:bg-rose-500/10">Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
