import React, { useMemo, useState } from 'react';
import { clearGameSessions, readGameSessions, summarizeGameSessions, type GameSession } from '../../utils/gameSessionHistory';

const fmtDate = (value: string) => {
  if (!value) return 'Chưa có';
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
};

export default function GameSessionHistory() {
  const [sessions, setSessions] = useState<GameSession[]>(readGameSessions);
  const summary = useMemo(() => summarizeGameSessions(sessions), [sessions]);
  const average = sessions.length ? sessions.reduce((sum, item) => sum + Number(item.score || 0), 0) / sessions.length : 0;
  const best = sessions.length ? Math.max(...sessions.map((item) => Number(item.score || 0))) : 0;
  const weakest = summary[0];

  const reset = () => {
    const yes = window.confirm('Xóa toàn bộ lịch sử chơi game trên trình duyệt này?');
    if (!yes) return;
    clearGameSessions();
    setSessions([]);
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-border-primary bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Game Session History</p>
        <h2 className="mt-2 text-xl font-black text-text-primary">Lịch sử từng lần chơi game</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Theo dõi attempts, điểm, verdict và ngày chơi của các game học kế toán/kiểm toán/founder finance. Dữ liệu này dùng để Game Progress đọc chính xác hơn thay vì chỉ đọc snapshot hiện tại.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Attempts</p><p className="mt-2 text-3xl font-black text-text-primary">{sessions.length}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Best score</p><p className="mt-2 text-3xl font-black text-emerald-300">{Math.round(best)}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Average</p><p className="mt-2 text-3xl font-black text-cyan-300">{Math.round(average)}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5"><p className="text-[10px] font-black uppercase text-text-tertiary">Nên luyện tiếp</p><p className="mt-2 text-sm font-black text-amber-300">{weakest?.gameLabel || 'Chưa có dữ liệu'}</p></div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-black text-text-primary">Tổng hợp theo game</h3>
            <p className="mt-1 text-xs font-semibold text-text-secondary">Game nào điểm trung bình thấp sẽ được gợi ý luyện lại trước.</p>
          </div>
          <button onClick={reset} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-black text-rose-200 hover:bg-rose-500/20">Xóa lịch sử</button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {summary.map((item) => (
            <div key={item.gameId} className="rounded-2xl border border-border-primary bg-slate-950/70 p-4">
              <p className="text-sm font-black text-text-primary">{item.gameLabel}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-bg-primary p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Attempts</p><p className="mt-1 text-xl font-black text-text-primary">{item.attempts}</p></div>
                <div className="rounded-xl bg-bg-primary p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Best</p><p className="mt-1 text-xl font-black text-emerald-300">{Math.round(item.bestScore)}</p></div>
                <div className="rounded-xl bg-bg-primary p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Avg</p><p className="mt-1 text-xl font-black text-cyan-300">{Math.round(item.averageScore)}</p></div>
              </div>
              <p className="mt-3 text-xs font-semibold text-text-secondary">Lần gần nhất: {fmtDate(item.latestPlayedAt)} • {item.latestVerdict}</p>
            </div>
          ))}
          {!summary.length && <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-5 text-sm font-bold text-text-secondary">Chưa có lịch sử. Chơi một game rồi bấm lưu kết quả để dashboard có dữ liệu.</div>}
        </div>
      </div>

      <div className="rounded-2xl border border-border-primary bg-bg-surface/70 p-5">
        <h3 className="text-sm font-black text-text-primary">Timeline gần nhất</h3>
        <div className="mt-4 space-y-2">
          {sessions.slice(0, 20).map((session) => (
            <div key={session.id} className="grid gap-2 rounded-2xl border border-border-primary bg-slate-950/70 p-4 md:grid-cols-[12rem_1fr_5rem] md:items-center">
              <p className="text-xs font-bold text-text-secondary">{fmtDate(session.playedAt)}</p>
              <div>
                <p className="text-sm font-black text-text-primary">{session.gameLabel}</p>
                <p className="mt-1 text-xs font-semibold text-text-secondary">{session.verdict}{session.note ? ` • ${session.note}` : ''}</p>
              </div>
              <p className="text-2xl font-black text-emerald-300 md:text-right">{Math.round(session.score)}</p>
            </div>
          ))}
          {!sessions.length && <p className="text-sm font-bold text-text-secondary">Chưa có lượt chơi nào được lưu.</p>}
        </div>
      </div>
    </section>
  );
}
