import React, { useMemo } from 'react';

type GameSnapshot = {
  key: string;
  label: string;
  skill: string;
  recommendation: string;
};

const GAME_KEYS: GameSnapshot[] = [
  {
    key: 'ledgerflow-cash-runway-game-v1',
    label: 'Cash Runway Game',
    skill: 'Runway, burn rate, tool cost, paid pilot decision',
    recommendation: 'Chơi lại khi runway < 6 tháng hoặc tool burn vượt 25% burn.'
  },
  {
    key: 'ledgerflow-pmf-decision-game-v1',
    label: 'PMF Decision Game',
    skill: 'Pain, pay signal, evidence, distribution và BUILD/HOLD/KILL',
    recommendation: 'Chơi lại trước khi quyết định build feature lớn.'
  },
  {
    key: 'ledgerflow-document-matching-game-v1',
    label: 'Document Matching Game',
    skill: 'Ghép chứng từ với nghiệp vụ/rủi ro kiểm toán',
    recommendation: 'Chơi lại khi mở rộng case bank hoặc thêm ngành mới.'
  },
  {
    key: 'ledgerflow-cost-flow-game-v1',
    label: 'Cost Flow Game',
    skill: 'Luồng chi phí: mua hàng, nhập kho, xuất dùng, dở dang, giá vốn',
    recommendation: 'Chơi lại khi học sản xuất/xây dựng/thương mại/dịch vụ.'
  },
  {
    key: 'ledgerflow-audit-red-flag-game-v1',
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

function avg(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function verdict(score: number) {
  if (score >= 80) return 'MASTERED';
  if (score >= 60) return 'PRACTICE MORE';
  return 'START / REPLAY';
}

export default function GameProgressDashboard() {
  const games = useMemo(() => GAME_KEYS.map((game) => {
    const data = safeParse(localStorage.getItem(game.key));
    const scores = extractScores(data);
    const bestScore = scores.length ? Math.max(...scores) : 0;
    const averageScore = Math.round(avg(scores));
    return {
      ...game,
      played: scores.length > 0,
      attempts: scores.length,
      bestScore,
      averageScore,
      verdict: verdict(bestScore)
    };
  }), []);

  const played = games.filter((game) => game.played).length;
  const bestAverage = Math.round(avg(games.map((game) => game.bestScore).filter((score) => score > 0)));
  const weakGames = games.filter((game) => !game.played || game.bestScore < 60);
  const nextGame = weakGames[0] || games.find((game) => game.bestScore < 80) || games[0];
  const learningScore = Math.round((played / Math.max(games.length, 1)) * 50 + Math.min(bestAverage, 100) * 0.5);

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Game Progress</p>
        <h2 className="mt-2 text-xl font-black text-white">Dashboard tiến độ mini-game</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Gom tiến độ từ các game playable để biết bạn đã luyện kỹ năng nào, game nào còn yếu và nên học tiếp phần nào.
        </p>
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
          <p className="text-[10px] font-black uppercase text-slate-500">Best avg</p>
          <p className="mt-2 text-3xl font-black text-cyan-300">{bestAverage}</p>
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
          <div key={game.key} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-300">{game.played ? 'Đã có dữ liệu' : 'Chưa có dữ liệu'}</p>
                <h3 className="mt-1 text-sm font-black text-white">{game.label}</h3>
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] font-black text-slate-300">{game.verdict}</span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{game.skill}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[10px] font-black uppercase text-slate-500">Attempts</p>
                <p className="mt-1 text-xl font-black text-white">{game.attempts}</p>
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
            <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-semibold leading-6 text-slate-400">{game.recommendation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
