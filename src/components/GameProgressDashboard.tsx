import React, { useEffect, useMemo, useState } from 'react';
import { GAME_SESSION_HISTORY_KEY, readGameSessions, type GameSession } from '../utils/gameSessionHistory';

type GameSnapshot = {
  gameId: string;
  legacyKey: string;
  label: string;
  skill: string;
  recommendation: string;
};

const GAME_KEYS: GameSnapshot[] = [
  {
    gameId: 'cash-runway-game',
    legacyKey: 'ledgerflow-cash-runway-game-v1',
    label: 'Cash Runway Game',
    skill: 'Runway, burn rate, tool cost, paid pilot decision',
    recommendation: 'Chơi lại khi runway < 6 tháng hoặc tool burn vượt 25% burn.'
  },
  {
    gameId: 'pmf-decision-game',
    legacyKey: 'ledgerflow-pmf-decision-game-v1',
    label: 'PMF Decision Game',
    skill: 'Pain, pay signal, evidence, distribution và BUILD/HOLD/KILL',
    recommendation: 'Chơi lại trước khi quyết định build feature lớn.'
  },
  {
    gameId: 'document-matching-game',
    legacyKey: 'ledgerflow-document-matching-game-v1',
    label: 'Document Matching Game',
    skill: 'Ghép chứng từ với nghiệp vụ/rủi ro kiểm toán',
    recommendation: 'Chơi lại khi mở rộng case bank hoặc thêm ngành mới.'
  },
  {
    gameId: 'cost-flow-game',
    legacyKey: 'ledgerflow-cost-flow-game-v1',
    label: 'Cost Flow Game',
    skill: 'Luồng chi phí: mua hàng, nhập kho, xuất dùng, dở dang, giá vốn',
    recommendation: 'Chơi lại khi học sản xuất/xây dựng/thương mại/dịch vụ.'
  },
  {
    gameId: 'audit-red-flag-game',
    legacyKey: 'ledgerflow-audit-red-flag-game-v1',
    label: 'Audit Red Flag Game',
    skill: 'Nhận diện red flags và chứng từ cần kiểm tra',
    recommendation: 'Chơi lại khi thêm red flag mới vào case bank.'
  }
];

function safeParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractScores(data: unknown): number[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data
      .map((item) => Number(item?.score ?? item?.survivalScore ?? item?.founderScore ?? item?.gameScore ?? item?.lastScore ?? 0))
      .filter((score) => Number.isFinite(score) && score > 0);
  }
  if (typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const directScore = Number(record.score ?? record.survivalScore ?? record.founderScore ?? record.gameScore ?? record.lastScore ?? 0);
    if (Number.isFinite(directScore) && directScore > 0) return [directScore];
    const history = record.history;
    if (Array.isArray(history)) return extractScores(history);
  }
  return [];
}

function sessionsForGame(sessions: GameSession[], game: GameSnapshot) {
  return sessions.filter((session) => session.gameId === game.gameId || session.gameLabel === game.label);
}

function extractSessionScores(sessions: GameSession[]) {
  return sessions
    .map((session) => Number(session.score || 0))
    .filter((score) => Number.isFinite(score) && score > 0);
}

function latestSession(sessions: GameSession[]) {
  return [...sessions].sort((a, b) => b.playedAt.localeCompare(a.playedAt))[0];
}

function avg(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function verdict(score: number) {
  if (score >= 80) return 'MASTERED';
  if (score >= 60) return 'PRACTICE MORE';
  return 'START / REPLAY';
}

function fmtDate(value?: string) {
  if (!value) return 'Chưa có';
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function GameProgressDashboard() {
  const [sessions, setSessions] = useState<GameSession[]>(() => readGameSessions());
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date().toISOString());

  const refreshSessions = () => {
    setSessions(readGameSessions());
    setLastRefreshedAt(new Date().toISOString());
  };

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === GAME_SESSION_HISTORY_KEY) refreshSessions();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const historyAttempts = sessions.length;

  const games = useMemo(() => GAME_KEYS.map((game) => {
    const matchedSessions = sessionsForGame(sessions, game);
    const sessionScores = extractSessionScores(matchedSessions);
    const legacyScores = sessionScores.length ? [] : extractScores(safeParse(localStorage.getItem(game.legacyKey)));
    const scores = sessionScores.length ? sessionScores : legacyScores;
    const latest = latestSession(matchedSessions);
    const bestScore = scores.length ? Math.max(...scores) : 0;
    const averageScore = Math.round(avg(scores));

    return {
      ...game,
      played: scores.length > 0,
      attempts: scores.length,
      historyAttempts: matchedSessions.length,
      bestScore,
      averageScore,
      verdict: latest?.verdict || verdict(bestScore),
      source: sessionScores.length ? 'Game History' : legacyScores.length ? 'Legacy snapshot' : 'Chưa có dữ liệu',
      latestPlayedAt: latest?.playedAt,
      latestVerdict: latest?.verdict
    };
  }), [sessions]);

  const played = games.filter((game) => game.played).length;
  const bestAverage = Math.round(avg(games.map((game) => game.bestScore).filter((score) => score > 0)));
  const weakGames = games.filter((game) => !game.played || game.bestScore < 60);
  const nextGame = weakGames[0] || games.find((game) => game.bestScore < 80) || games[0];
  const learningScore = Math.round((played / Math.max(games.length, 1)) * 50 + Math.min(bestAverage, 100) * 0.5);
  const recentSessions = useMemo(() => [...sessions].sort((a, b) => b.playedAt.localeCompare(a.playedAt)).slice(0, 8), [sessions]);

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Game Progress</p>
            <h2 className="mt-2 text-xl font-black text-white">Dashboard tiến độ mini-game</h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
              Nguồn chính: <span className="font-black text-emerald-200">{GAME_SESSION_HISTORY_KEY}</span>. Dashboard ưu tiên lịch sử từng lượt chơi, chỉ fallback snapshot cũ khi game chưa có dữ liệu trong Game History.
            </p>
          </div>
          <button onClick={refreshSessions} className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-xs font-black text-emerald-100 hover:bg-emerald-400/20">
            Refresh history
          </button>
        </div>
        <p className="mt-3 text-[11px] font-semibold text-slate-500">Cập nhật lần cuối: {fmtDate(lastRefreshedAt)}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-[10px] font-black uppercase text-slate-500">Learning score</p>
          <p className="mt-2 text-3xl font-black text-white">{learningScore}/100</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-[10px] font-black uppercase text-slate-500">Game đã chơi</p>
          <p className="mt-2 text-3xl font-black text-emerald-300">{played}/{games.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-[10px] font-black uppercase text-slate-500">History attempts</p>
          <p className="mt-2 text-3xl font-black text-cyan-300">{historyAttempts}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <p className="text-[10px] font-black uppercase text-slate-500">Nên chơi tiếp</p>
          <p className="mt-2 text-sm font-black text-amber-300">{nextGame?.label}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <p className="text-[10px] font-black uppercase text-amber-300">Gợi ý học tiếp</p>
        <h3 className="mt-2 text-lg font-black text-white">{nextGame?.label}</h3>
        <p className="mt-2 text-xs font-semibold leading-6 text-amber-100">{nextGame?.recommendation}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {games.map((game) => (
          <div key={game.gameId} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-300">{game.source}</p>
                <h3 className="mt-1 text-sm font-black text-white">{game.label}</h3>
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] font-black text-slate-300">{game.verdict}</span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{game.skill}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[10px] font-black uppercase text-slate-500">Attempts</p>
                <p className="mt-1 text-xl font-black text-white">{game.attempts}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[10px] font-black uppercase text-slate-500">History</p>
                <p className="mt-1 text-xl font-black text-emerald-300">{game.historyAttempts}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[10px] font-black uppercase text-slate-500">Best</p>
                <p className="mt-1 text-xl font-black text-emerald-300">{game.bestScore}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[10px] font-black uppercase text-slate-500">Avg</p>
                <p className="mt-1 text-xl font-black text-cyan-300">{game.averageScore}</p>
              </div>
            </div>
            <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-semibold leading-6 text-slate-400">
              Lần gần nhất: {fmtDate(game.latestPlayedAt)}{game.latestVerdict ? ` • ${game.latestVerdict}` : ''}
            </p>
            <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-semibold leading-6 text-slate-400">{game.recommendation}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase text-cyan-300">Recent Game History</p>
            <h3 className="mt-1 text-lg font-black text-white">8 lượt chơi gần nhất từ nguồn chính</h3>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] font-black text-slate-400">{GAME_SESSION_HISTORY_KEY}</span>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          {recentSessions.length === 0 ? (
            <p className="p-4 text-sm font-semibold text-slate-400">Chưa có lượt chơi trong Game History. Hãy vào từng mini-game và bấm lưu/nộp bài.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentSessions.map((session) => (
                <div key={session.id} className="grid gap-3 p-4 text-xs font-semibold text-slate-300 md:grid-cols-[10rem_1fr_4rem_10rem]">
                  <div className="text-slate-500">{fmtDate(session.playedAt)}</div>
                  <div>
                    <p className="font-black text-white">{session.gameLabel}</p>
                    {session.note && <p className="mt-1 leading-5 text-slate-400">{session.note}</p>}
                  </div>
                  <div className="font-black text-emerald-300">{session.score}</div>
                  <div className="text-slate-300">{session.verdict}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
